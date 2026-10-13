/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { FlashSaleItem } from './entities/flash-sale-item.entity';
import { FlashSaleEvent } from './entities/flash-sale-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSaleService } from './services/flash-sale.service';
import { ProductModule } from '../product/product.module';
import { FlashSaleEventController } from './controllers/flash-sale-event.controller';
import { FlashSalePurchaseProcessor } from './processors/flash-sale-purchase.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([FlashSaleEvent, FlashSaleItem]),
        ProductModule,
    ],
    controllers: [FlashSaleEventController],
    providers: [FlashSaleService, FlashSalePurchaseProcessor],
    exports: [FlashSaleService],
})
export class FlashSaleModule { }
