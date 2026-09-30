import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../user/entities/user.entity";
import { Repository } from "typeorm";
import { OtpToken } from "../entities/otp-token.entity";
import { MailerService } from '@nestjs-modules/mailer';
import { RegisterRequestDto } from "../dto/register-request.dto";
import * as bcrypt from 'bcrypt';
import { Role } from "../../user/enums/role.enum";
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(OtpToken)
        private readonly otpTokenRepository: Repository<OtpToken>,

        private readonly mailerService: MailerService
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

        await this.senOtp(savedUser);

        const { password, ...result } = savedUser;
        return {
            message: 'User registered successfully. Please check your email for the OTP code.',
            data: result
        }
    }
    private async senOtp(user: User): Promise<string> {
        const optCode = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

        const otp = this.otpTokenRepository.create(
            {
                code: optCode,
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
            <h1>${otp}</h1>
            <p>This code will expire in 2 minutes.</p>
  `,
            context: {
                name: fullName,
                otp: optCode
            }
        });
        return optCode;
    }
}