import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderStatus } from "../enums/order-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { OrderItem } from "./order-item.entity";
import { User } from "../../user/entities/user.entity";
import { Payment } from "../../payment/entities/payment.entity";

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 50, name: 'order_code' })
    orderCode: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
    totalAmount: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method' })
    paymentMethod: PaymentMethod;

    @Column({ default: false, name: 'is_flash_sale' })
    isFlashSale: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => OrderItem, (item) => item.order, {
        cascade: true
    })
    orderItems: OrderItem[];


    @OneToOne(() => Payment, (payment) => payment.order)
    payment: Payment;
}