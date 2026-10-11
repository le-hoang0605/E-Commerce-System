import { FlashSaleItemResponseDto } from './flash-sale-item-response.dto';

export class FlashSaleEventResponseDto {
    id: number;
    title: string;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    createdAt: Date;
    items: FlashSaleItemResponseDto[];
}