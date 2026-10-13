import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class PurchaseFlashSaleDto {
    @IsNotEmpty({ message: 'Flash sale item ID is required' })
    @IsNumber({}, { message: 'Flash sale item ID must be a number' })
    flashSaleItemId: number;

    @IsNotEmpty({ message: 'Quantity is required' })
    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number = 1;
}