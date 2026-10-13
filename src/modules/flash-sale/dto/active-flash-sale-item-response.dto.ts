export class ActiveFlashSaleItemResponseDto {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    originalPrice: number;
    flashSalePrice: number;
    availableStock: number;
    allocatedStock: number;
    soldQuantity: number;
    limitPerUser: number;
}