import { InjectRepository } from "@nestjs/typeorm";
import { FlashSaleEvent } from "../entities/flash-sale-event.entity";
import { Repository } from "typeorm";
import { FlashSaleItem } from "../entities/flash-sale-item.entity";
import { ProductService } from "../../product/services/product.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, NotFoundException } from "@nestjs/common";
import { CreateFlashSaleEventDto } from "../dto/create-flash-sale-event.dto";
import { FlashSaleEventResponseDto } from "../dto/flash-sale-event-response.dto";
import type { Cache } from 'cache-manager';

export class FlashSaleService {
    constructor(
        @InjectRepository(FlashSaleEvent)
        private readonly flashSaleEventRepository: Repository<FlashSaleEvent>,

        @InjectRepository(FlashSaleItem)
        private readonly flashSaleItemRepository: Repository<FlashSaleItem>,

        private readonly productService: ProductService,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }
    async createEvent(dto: CreateFlashSaleEventDto): Promise<FlashSaleEventResponseDto> {
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);

        if (start >= end) {
            throw new BadRequestException('Start time must be earlier than end time');
        }

        const productIds = dto.items.map((item) => item.productId);
        const products = await this.productService.findByIds(productIds);

        if (products.length !== productIds.length) {
            throw new NotFoundException('One or more products in the request list do not exist');
        }

        const productMap = new Map(products.map((p) => [p.id, p]));
        for (const itemDto of dto.items) {
            const product = productMap.get(itemDto.productId);
            if (product && itemDto.allocatedStock > product.stockQuantity) {
                throw new BadRequestException(
                    `Product ID ${product.id} (${product.name}) has only ${product.stockQuantity} items in stock, cannot allocate ${itemDto.allocatedStock}`,
                );
            }
        }

        const event = this.flashSaleEventRepository.create({
            title: dto.title,
            startTime: start,
            endTime: end,
            isActive: true,
            items: dto.items.map((itemDto) =>
                this.flashSaleItemRepository.create({
                    productId: itemDto.productId,
                    flashSalePrice: itemDto.flashSalePrice,
                    allocatedStock: itemDto.allocatedStock,
                    limitPerUser: itemDto.limitPerUser,
                    soldQuantity: 0,
                }),
            ),
        });

        const savedEvent = await this.flashSaleEventRepository.save(event);

        const nowMs = Date.now();
        const endMs = end.getTime();
        const ttlMs = Math.max(endMs - nowMs, 3600000);

        await Promise.all(
            savedEvent.items.map((item) => {
                const cacheKey = `flashsale:stock:${item.id}`;
                return this.cacheManager.set(cacheKey, item.allocatedStock, ttlMs);
            }),
        );

        return {
            id: savedEvent.id,
            title: savedEvent.title,
            startTime: savedEvent.startTime,
            endTime: savedEvent.endTime,
            isActive: savedEvent.isActive,
            createdAt: savedEvent.createdAt,
            items: savedEvent.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                flashSalePrice: Number(item.flashSalePrice),
                soldQuantity: item.soldQuantity,
                allocatedStock: item.allocatedStock,
                limitPerUser: item.limitPerUser,
            })),
        };
    }
}