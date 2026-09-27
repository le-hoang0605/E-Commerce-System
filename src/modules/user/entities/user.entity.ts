import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { Order } from "../../order/entities/order.entity";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 150 })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({ length: 100, name: 'first_name' })
    firstName: string;

    @Column({ length: 100, name: 'last_name' })
    lastName: string;

    @Column({ nullable: true, length: 20 })
    phone: string;

    @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
    role: Role;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

}