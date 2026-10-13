import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PurchaseJobPayload } from '../interfaces/purchase-job-payload.interface';
import { Job } from 'bullmq';
import { FlashSaleItem } from '../entities/flash-sale-item.entity';
import { Product } from '../../product/entities/product.entity';
@Processor('flash-sale-purchase')
export class FlashSalePurchaseProcessor extends WorkerHost {
    private readonly logger = new Logger(FlashSalePurchaseProcessor.name);

    constructor(private readonly dataSource: DataSource) {
        super();
    }
    async process(job: Job<PurchaseJobPayload>): Promise<void> {
        const { userId, flashSaleItemId, quantity } = job.data;
        this.logger.log(
            `Processing flash sale purchase job #${job.id} for User #${userId}, Item #${flashSaleItemId}`,
        );

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const flashSaleItem = await queryRunner.manager.findOne(FlashSaleItem, {
                where: { id: flashSaleItemId },
                relations: {
                    product: true,
                },
                lock: { mode: 'pessimistic_write' },
            });

            if (!flashSaleItem) {
                throw new Error(`Flash sale item ID ${flashSaleItemId} not found`);
            }

            flashSaleItem.soldQuantity += quantity;
            await queryRunner.manager.save(flashSaleItem);

            const product = await queryRunner.manager.findOne(Product, {
                where: { id: flashSaleItem.productId },
                lock: { mode: 'pessimistic_write' },
            });

            if (product) {
                product.stockQuantity -= quantity;
                await queryRunner.manager.save(product);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully completed order for Job #${job.id}`);
        } catch (error: unknown) {
            await queryRunner.rollbackTransaction();

            const message =
                error instanceof Error ? error.message : String(error);

            const stack =
                error instanceof Error ? error.stack : undefined;

            this.logger.error(
                `Failed to process purchase job #${job.id}: ${message}`,
                stack,
            );

            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}