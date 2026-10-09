import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ProductService } from "../services/product.service";
import { PaginatedProductResponseDto } from "../dto/paginated-product-response.dto";
import { GetProductsQueryDto } from "../dto/get-products-query.dto";
import { ProductDetailResponseDto } from "../dto/product-detail-response.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../user/enums/role.enum";
import { CreateProductDto } from "../dto/create-product.dto";
import { ProductResponseDto } from "../dto/product-response.dto";
import { UpdateProductDto } from "../dto/update-product.dto";

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

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createProductDto: CreateProductDto,
    ): Promise<ProductResponseDto> {
        return this.productService.create(createProductDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: number,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<ProductDetailResponseDto> {
        return this.productService.update(id, updateProductDto);
    }
}