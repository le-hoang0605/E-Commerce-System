import { Product } from "../entities/product.entity";
import { PaginationMetaDto } from "./pagination-meta.dto";

export class PaginatedProductResponseDto {
    data: Product[];
    meta: PaginationMetaDto;
}