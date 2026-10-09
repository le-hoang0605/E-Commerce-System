import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "../entities/product.entity";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PaginatedProductResponseDto } from "../dto/paginated-product-response.dto";
import { GetProductsQueryDto } from "../dto/get-products-query.dto";
import type { Cache } from 'cache-manager';
import { ProductDetailResponseDto } from "../dto/product-detail-response.dto";
import { CreateProductDto } from "../dto/create-product.dto";

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }
    async findAll(query: GetProductsQueryDto): Promise<PaginatedProductResponseDto> {
        const { page = 1, limit = 10, search } = query;

        const cacheKey = `products:${page}:${limit}:${search || ''}`;

        //cache hit
        const cachedData = await this.cacheManager.get<PaginatedProductResponseDto>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        //cache miss
        const skip = (page - 1) * limit;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .where('product.isActive = :isActive', { isActive: true });

        if (search) {
            queryBuilder.andWhere('product.name LIKE :search OR product.sku ILIKE :search', { search: `%${search}%` });
        }

        const [items, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('product.createdAt', 'DESC')
            .getManyAndCount();

        const result: PaginatedProductResponseDto = {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        //save the result in cache for 5 minutes
        await this.cacheManager.set(cacheKey, result, 60 * 5 * 1000);

        return result;
    }

    async findOne(id: number): Promise<ProductDetailResponseDto> {
        const cacheKey = `product:${id}`;

        //cache hit
        const cachedData = await this.cacheManager.get<ProductDetailResponseDto>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        //cache miss
        const product = await this.productRepository.findOne({ where: { id, isActive: true } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const result: ProductDetailResponseDto = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            originalPrice: product.originalPrice,
            stockQuantity: product.stockQuantity,
            imageUrl: product.imageUrl,
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };


        await this.cacheManager.set(cacheKey, result, 60 * 10 * 1000);

        return result;
    }

    async create(createProductDto: CreateProductDto): Promise<ProductDetailResponseDto> {
        const existingProduct = await this.productRepository.findOne({ where: { sku: createProductDto.sku } });
        if (existingProduct) {
            throw new ConflictException('Product with this SKU already exists');
        }

        const newProduct = this.productRepository.create(createProductDto);
        const savedProduct = await this.productRepository.save(newProduct);

        await this.clearCacheForProduct();

        return {
            id: savedProduct.id,
            name: savedProduct.name,
            sku: savedProduct.sku,
            description: savedProduct.description,
            originalPrice: Number(savedProduct.originalPrice),
            stockQuantity: savedProduct.stockQuantity,
            imageUrl: savedProduct.imageUrl,
            isActive: savedProduct.isActive,
            createdAt: savedProduct.createdAt,
            updatedAt: savedProduct.updatedAt,
        };
    }

    private async clearCacheForProduct(): Promise<void> {
        const store = this.cacheManager.stores as any;

        if (store.client && typeof store.client.keys === 'function') {
            const keys: string[] = await store.client.keys('products:*');
            if (keys.length > 0) {
                await Promise.all(keys.map((key) => this.cacheManager.del(key)));
            }
            return;
        }

        if (typeof store.keys === 'function') {
            const rawKeys: string[] = await store.keys();
            const keyList = Array.from(rawKeys) as string[];

            const keys = keyList.filter((key) => key.startsWith('products:'));
            if (keys.length > 0) {
                await Promise.all(keys.map((key) => this.cacheManager.del(key)));
            }
        }
    }
}