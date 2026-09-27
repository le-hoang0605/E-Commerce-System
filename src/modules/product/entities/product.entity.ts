import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FlashSaleItem } from "../../flash-sale/entities/flash-sale-item.entity";
import { OrderItem } from "../../order/entities/order-item.entity";

@Entity('product')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ unique: true, length: 50 })
    sku: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'original_price' })
    originalPrice: number;

    @Column({ type: 'int', default: 0, name: 'stock_quantity' })
    stockQuantity: number;

    @Column({ nullable: true, length: 500 })
    imageUrl: string;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => FlashSaleItem, (item) => item.product)
    flashSaleItems: FlashSaleItem[];

    @OneToMany(() => OrderItem, (item) => item.product)
    orderItems: OrderItem[];
}