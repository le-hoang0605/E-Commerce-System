import { InjectRepository } from "@nestjs/typeorm";
import { FlashSaleEvent } from "../entities/flash-sale-event.entity";
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FlashSaleItem } from "../entities/flash-sale-item.entity";
import { ProductService } from "../../product/services/product.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, ConflictException, Inject, NotFoundException } from "@nestjs/common";
import { CreateFlashSaleEventDto } from "../dto/create-flash-sale-event.dto";
import { FlashSaleEventResponseDto } from "../dto/flash-sale-event-response.dto";
import type { Cache } from 'cache-manager';
import { ActiveFlashSaleResponseDto } from "../dto/active-flash-sale-response.dto";
import { ActiveFlashSaleItemResponseDto } from "../dto/active-flash-sale-item-response.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PurchaseFlashSaleDto } from "../dto/purchase-flash-sale.dto";
import { PurchaseFlashSaleResponseDto } from "../dto/purchase-flash-sale-response.dto";

export class FlashSaleService {
    constructor(
        @InjectRepository(FlashSaleEvent)
        private readonly flashSaleEventRepository: Repository<FlashSaleEvent>,

        @InjectRepository(FlashSaleItem)
        private readonly flashSaleItemRepository: Repository<FlashSaleItem>,

        private readonly productService: ProductService,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,

        @InjectQueue('flash-sale-purchase')
        private readonly purchaseQueue: Queue,
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

    async getActiveFlashSale(): Promise<ActiveFlashSaleResponseDto> {
        const now = new Date();

        const activeEvent = await this.flashSaleEventRepository.findOne({
            where: {
                isActive: true,
                startTime: LessThanOrEqual(now),
                endTime: MoreThanOrEqual(now),
            },
            relations: {
                items: {
                    product: true,
                },
            },
        });

        if (!activeEvent) {
            throw new NotFoundException('There is no active Flash Sale event at this time');
        }

        const itemDtos: ActiveFlashSaleItemResponseDto[] = await Promise.all(
            activeEvent.items.map(async (item) => {
                const cacheKey = `flashsale:stock:${item.id}`;
                const cachedStock = await this.cacheManager.get<number>(cacheKey);

                const availableStock = cachedStock !== null && cachedStock !== undefined
                    ? Number(cachedStock)
                    : item.allocatedStock - item.soldQuantity;

                return {
                    id: item.id,
                    productId: item.productId,
                    productName: item.product?.name || '',
                    productImage: item.product?.imageUrl || '',
                    originalPrice: Number(item.product?.originalPrice || 0),
                    flashSalePrice: Number(item.flashSalePrice),
                    availableStock: Math.max(availableStock, 0),
                    allocatedStock: item.allocatedStock,
                    soldQuantity: item.soldQuantity,
                    limitPerUser: item.limitPerUser,
                };
            }),
        );
        return {
            id: activeEvent.id,
            title: activeEvent.title,
            startTime: activeEvent.startTime,
            endTime: activeEvent.endTime,
            items: itemDtos,
        };
    }
    async purchase(
        userId: number,
        dto: PurchaseFlashSaleDto,
    ): Promise<PurchaseFlashSaleResponseDto> {
        const { flashSaleItemId, quantity } = dto;

        const flashSaleItem = await this.flashSaleItemRepository.findOne({
            where: { id: flashSaleItemId },
            relations: {
                flashSaleEvent: true,
            },
        });

        if (!flashSaleItem || !flashSaleItem.flashSaleEvent.isActive) {
            throw new NotFoundException('Flash sale item is not active or does not exist');
        }

        const now = new Date();
        if (
            now < flashSaleItem.flashSaleEvent.startTime ||
            now > flashSaleItem.flashSaleEvent.endTime
        ) {
            throw new BadRequestException('Flash sale event is not currently ongoing');
        }

        const stockKey = `flashsale:stock:${flashSaleItemId}`;
        const userBoughtKey = `flashsale:user_bought:${flashSaleItemId}:${userId}`;

        const luaScript = `
      local stockKey = KEYS[1]
      local userKey = KEYS[2]
      local qty = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])

      local currentStock = tonumber(redis.call('get', stockKey) or '-1')
      if currentStock < qty then
          return -1 -- Out of stock
      end

      local userBought = tonumber(redis.call('get', userKey) or '0')
      if (userBought + qty) > limit then
          return -2 -- Exceeds limit per user
      end

      redis.call('decrby', stockKey, qty)
      redis.call('incrby', userKey, qty)
      return 1 -- Success
    `;

        const store = this.cacheManager.stores as any;
        let luaResult: number;

        if (store.client && typeof store.client.eval === 'function') {
            luaResult = await store.client.eval(
                luaScript,
                2,
                stockKey,
                userBoughtKey,
                quantity,
                flashSaleItem.limitPerUser,
            );
        } else {
            const cachedStock = (await this.cacheManager.get<number>(stockKey)) ?? 0;
            if (cachedStock < quantity) {
                luaResult = -1;
            } else {
                await this.cacheManager.set(stockKey, cachedStock - quantity);
                luaResult = 1;
            }
        }

        if (luaResult === -1) {
            throw new ConflictException('Product is out of stock in this Flash Sale event');
        }

        if (luaResult === -2) {
            throw new BadRequestException(
                `You have reached the maximum allowed limit (${flashSaleItem.limitPerUser}) for this item`,
            );
        }

        const job = await this.purchaseQueue.add(
            'process-purchase',
            {
                userId,
                flashSaleItemId,
                quantity,
            },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
            },
        );

        return {
            message: 'Flash sale purchase request queued successfully',
            jobId: String(job.id),
            flashSaleItemId,
            quantity,
        };
    }
}