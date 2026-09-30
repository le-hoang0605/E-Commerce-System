import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity('otp_tokens')
export class OtpToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 6 })
    code: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @Column({ default: false, name: 'is_used' })
    isUsed: boolean;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}