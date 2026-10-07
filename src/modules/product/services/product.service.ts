import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "../entities/product.entity";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PaginatedProductResponseDto } from "../dto/paginated-product-response.dto";
import { GetProductsQueryDto } from "../dto/get-products-query.dto";
import type { Cache } from 'cache-manager';

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
}