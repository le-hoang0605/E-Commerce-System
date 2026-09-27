import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FlashSaleItem } from "./flash-sale-item.entity";

@Entity('flash_sale_events')
export class FlashSaleEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150 })
    title: string;

    @Column({ type: 'datetime', name: 'start_time' })
    startTime: Date;

    @Column({ type: 'datetime', name: 'end_time' })
    endTime: Date;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => FlashSaleItem, (item) => item.flashSaleEvent, {
        cascade: true
    })
    items: FlashSaleItem[];
}