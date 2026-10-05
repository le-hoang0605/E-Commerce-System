import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from "../../user/services/user.service";
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../../user/entities/user.entity";
import { AuthenticatedUser } from "../interfaces/authenticated-user.interface";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_SECRET'),
        });
    }
    async validate(payload: JwtPayload): Promise<AuthenticatedUser | null> {
        const user = await this.userService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        if (!user.isVerified) {
            throw new UnauthorizedException('User not verified');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
}