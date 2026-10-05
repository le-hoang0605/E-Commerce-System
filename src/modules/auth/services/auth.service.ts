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
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(OtpToken)
        private readonly otpTokenRepository: Repository<OtpToken>,

        private readonly mailerService: MailerService,

        private readonly userService: UserService,

        private readonly jwtService: JwtService,

        private readonly configService: ConfigService,
    ) { }
    async register(registerRequestDto: RegisterRequestDto) {
        const existingUser = await this.userRepository.findOne({ where: { email: registerRequestDto.email } });
        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(registerRequestDto.password, 10);

        const newUser = this.userRepository.create(
            {
                email: registerRequestDto.email,
                password: hashedPassword,
                firstName: registerRequestDto.firstName,
                lastName: registerRequestDto.lastName,
                phone: registerRequestDto.phone,
                role: Role.CUSTOMER
            }
        );
        const savedUser = await this.userRepository.save(newUser);

        await this.sendOtp(savedUser);

        const { password, ...result } = savedUser;
        return {
            message: 'User registered successfully. Please check your email for the OTP code.',
            data: result
        }
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const user = await this.userRepository.findOne({ where: { email: verifyOtpDto.email } });
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

        user.isVerified = true;
        await this.userRepository.save(user);

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

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userService.findByEmail(email);
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

    async refreshToken(refreshToken: RefreshTokenDto) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken.refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
            if (payload.type !== 'refresh') {
                throw new BadRequestException('Invalid refresh token');
            }

            const user = await this.userService.findById(payload.sub);
            if (!user) {
                throw new BadRequestException('User not found');
            }
            const accessPayLoad: JwtPayload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            const accessToken = await this.jwtService.signAsync(accessPayLoad, {
                secret: this.configService.getOrThrow('JWT_SECRET'),
                expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
            });
            return {
                message: 'Token refreshed successfully',
                data: {
                    accessToken
                }
            };
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }


    private async generateTokens(user: User) {
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
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken
            },
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone
            }
        }
    }
}