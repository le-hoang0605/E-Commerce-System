import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../user/entities/user.entity";
import { Repository } from "typeorm";
import { OtpToken } from "../entities/otp-token.entity";
import { MailerService } from '@nestjs-modules/mailer';
import { RegisterRequestDto } from "../dto/register-request.dto";
import * as bcrypt from 'bcrypt';
import { Role } from "../../user/enums/role.enum";
import { VerifyOtpDto } from "../dto/verify-otp.dto";
import { LoginDto } from "../dto/log-in.dto";
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from "../../user/services/user.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { JwtRefresh } from "../interfaces/jwt-refresh.interface";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { RegisterResult } from "../dto/register-result.dto";
import { LoginResult } from "../dto/login-result.dto";
import { RefreshTokenResult } from "../dto/refresh-token-result.dto";
@Injectable()
export class AuthService {
    constructor(

        @InjectRepository(OtpToken)
        private readonly otpTokenRepository: Repository<OtpToken>,

        private readonly mailerService: MailerService,

        private readonly userService: UserService,

        private readonly jwtService: JwtService,

        private readonly configService: ConfigService,
    ) { }
    async register(registerRequestDto: RegisterRequestDto): Promise<RegisterResult> {
        const existingUser = await this.userService.findByEmail(registerRequestDto.email);
        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(registerRequestDto.password, 10);

        const newUser: User = await this.userService.createUser({
            email: registerRequestDto.email,
            password: hashedPassword,
            firstName: registerRequestDto.firstName,
            lastName: registerRequestDto.lastName,
            phone: registerRequestDto.phone,
            role: Role.CUSTOMER,
            isVerified: false,
        });

        await this.sendOtp(newUser);

        return {
            message:
                'User registered successfully. Please check your email for the OTP code.',
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phone: newUser.phone,
            },
        };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
        const user = await this.userService.findByEmail(verifyOtpDto.email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('User is already verified');
        }

        const otpRecord = await this.otpTokenRepository.findOne({
            where: {
                userId: user.id,
                code: verifyOtpDto.otp,
                isUsed: false,
            },
            order: { createdAt: 'DESC' }
        });

        if (!otpRecord) {
            throw new BadRequestException('Invalid OTP code');
        }

        if (otpRecord.expiresAt < new Date()) {
            throw new BadRequestException('OTP code has expired');
        }

        otpRecord.isUsed = true;
        await this.otpTokenRepository.save(otpRecord);

        await this.userService.markAsVerified(user.id);

        return {
            message: 'User verified successfully'
        }
    }


    private async sendOtp(user: User): Promise<string> {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

        const otp = this.otpTokenRepository.create(
            {
                code: otpCode,
                expiresAt,
                userId: user.id
            }
        );
        await this.otpTokenRepository.save(otp);

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Your OTP Code',
            html: `
            <h2>Hello ${fullName}</h2>
            <p>Your OTP code is:</p>
            <h1>${otpCode}</h1>
            <p>This code will expire in 2 minutes.</p>
  `,
            context: {
                name: fullName,
                otp: otpCode
            }
        });
        return otpCode;
    }

    async login(loginDto: LoginDto): Promise<LoginResult> {
        const { email, password } = loginDto;

        const user = await this.userService.findByEmailWithPassword(email);
        if (!user) {
            throw new BadRequestException('Invalid email or password');
        }
        if (!user.isVerified) {
            throw new BadRequestException('User is not verified. Please verify your account first.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid email or password');
        }
        return this.generateTokens(user);
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResult> {
        let payload: JwtRefresh;

        try {
            payload = await this.jwtService.verifyAsync<JwtRefresh>(
                refreshTokenDto.refreshToken,
                {
                    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                },
            );
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        if (payload.type !== 'refresh') {
            throw new BadRequestException('Invalid refresh token type');
        }

        const user: User | null = await this.userService.findById(payload.sub);
        if (!user || !user.isVerified) {
            throw new UnauthorizedException('User not found or not verified');
        }

        const accessPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken: string = await this.jwtService.signAsync(accessPayload, {
            secret: this.configService.getOrThrow<string>('JWT_SECRET'),
            expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME') as any,
        });

        return {
            accessToken,
        };
    }


    private async generateTokens(user: User): Promise<LoginResult> {
        const accessPayLoad: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const refreshPayLoad: JwtRefresh = {
            sub: user.id,
            type: 'refresh'
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayLoad, {
                secret: this.configService.getOrThrow('JWT_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
            }),
            this.jwtService.signAsync(refreshPayLoad, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
            })
        ]);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
            },
        }
    }
}