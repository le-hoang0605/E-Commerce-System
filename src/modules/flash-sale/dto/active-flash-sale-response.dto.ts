import { ActiveFlashSaleItemResponseDto } from './active-flash-sale-item-response.dto';

export class ActiveFlashSaleResponseDto {
    id: number;
    title: string;
    startTime: Date;
    endTime: Date;
    items: ActiveFlashSaleItemResponseDto[];
}