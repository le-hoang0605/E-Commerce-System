export class ProductResponseDto {
    id: number;
    name: string;
    sku: string;
    description: string;
    originalPrice: number;
    stockQuantity: number;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}