/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { FlashSaleItem } from './entities/flash-sale-item.entity';
import { FlashSaleEvent } from './entities/flash-sale-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([FlashSaleEvent, FlashSaleItem])],
    controllers: [],
    providers: [],
})
export class FlashSaleModule { }
