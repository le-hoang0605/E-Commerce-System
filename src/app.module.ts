import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { FlashSaleModule } from './modules/flash-sale/flash-sale.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AppDataSource } from './config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    UserModule,
    ProductModule,
    FlashSaleModule,
    OrderModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
