import { Controller, Get, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { ProductService } from "../services/product.service";
import { PaginatedProductResponseDto } from "../dto/paginated-product-response.dto";
import { GetProductsQueryDto } from "../dto/get-products-query.dto";
import { ProductDetailResponseDto } from "../dto/product-detail-response.dto";

@Controller('api/v1/products')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(@Query() query: GetProductsQueryDto): Promise<PaginatedProductResponseDto> {
        return this.productService.findAll(query);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Query('id') id: number): Promise<ProductDetailResponseDto> {
        return this.productService.findOne(id);
    }
}