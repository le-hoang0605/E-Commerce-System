import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Product } from "../../product/entities/product.entity";
import { FlashSaleEvent } from "./flash-sale-event.entity";

@Entity('flash_sale_items')
@Unique(['flashSaleId', 'productId'])
export class FlashSaleItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'product_id' })
    productId: number;

    @Column({ name: 'flash_sale_id' })
    flashSaleId: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'flash_sale_price' })
    flashSalePrice: number;

    @Column({ type: 'int', default: 0, name: 'sold_quantity' })
    soldQuantity: number;

    @Column({ type: 'int', name: 'allocated_stock' })
    allocatedStock: number;

    @Column({ type: 'int', default: 1, name: 'limit_per_user' })
    limitPerUser: number;

    @ManyToOne(() => FlashSaleEvent, (event) => event.items, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'flash_sale_id' })
    flashSaleEvent: FlashSaleEvent;

    @ManyToOne(() => Product, (product) => product.flashSaleItems)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}