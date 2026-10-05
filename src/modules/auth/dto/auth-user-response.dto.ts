import { Role } from "../../user/enums/role.enum";

export class AuthUserResponse {
    id: number;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    phone?: string;
}