/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Payment])],
    controllers: [],
    providers: [],
})
export class PaymentModule { }
