import { AuthUserResponse } from "./auth-user-response.dto";

export class LoginResult {
    accessToken: string;
    refreshToken: string;
    user: AuthUserResponse;
}