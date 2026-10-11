import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { CreateFlashSaleItemDto } from "./create-flash-sale-item.dto";

export class CreateFlashSaleEventDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsDateString()
    startTime: string;

    @IsNotEmpty()
    @IsDateString()
    endTime: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateFlashSaleItemDto)
    items: CreateFlashSaleItemDto[];
}