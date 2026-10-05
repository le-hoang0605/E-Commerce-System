import { AuthUserResponse } from "./auth-user-response.dto";

export class RegisterResult {
    message: string;
    user: Omit<AuthUserResponse, 'password'>;
}