/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem])],
    controllers: [],
    providers: [],
})
export class OrderModule { }
