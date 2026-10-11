import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateFlashSaleItemDto {
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    flashSalePrice: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    allocatedStock: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    limitPerUser: number;
}