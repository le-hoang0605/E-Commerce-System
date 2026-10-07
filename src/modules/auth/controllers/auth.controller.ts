import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { RegisterRequestDto } from "../dto/register-request.dto";
import { VerifyOtpDto } from "../dto/verify-otp.dto";
import { RegisterResult } from "../dto/register-result.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RefreshTokenResult } from "../dto/refresh-token-result.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { LoginResult } from "../dto/login-result.dto";
import { LoginDto } from "../dto/log-in.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthUserResponse } from "../dto/auth-user-response.dto";

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() registerRequestDto: RegisterRequestDto): Promise<RegisterResult> {
        return this.authService.register(registerRequestDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
        return this.authService.verifyOtp(verifyOtpDto);
    }
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto,): Promise<LoginResult> {
        return this.authService.login(loginDto);
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto,): Promise<RefreshTokenResult> {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    getProfile(@CurrentUser() user: AuthUserResponse): AuthUserResponse {
        return user;
    }

}