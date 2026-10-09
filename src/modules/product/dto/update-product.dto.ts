import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    sku?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    originalPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}