import { Role } from "../../user/enums/role.enum";

export interface JwtPayload {
    sub: number; // User ID
    email: string;
    role: Role;
}