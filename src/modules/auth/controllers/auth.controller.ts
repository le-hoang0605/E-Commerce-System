import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { RegisterRequestDto } from "../dto/register-request.dto";

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() registerRequestDto: RegisterRequestDto) {
        return this.authService.register(registerRequestDto);
    }
}