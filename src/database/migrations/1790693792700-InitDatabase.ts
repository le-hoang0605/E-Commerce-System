import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1790693792700 implements MigrationInterface {
    name = 'InitDatabase1790693792700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`first_name\` varchar(100) NOT NULL, \`last_name\` varchar(100) NOT NULL, \`phone\` varchar(20) NULL, \`role\` enum ('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`order_id\` int NOT NULL, \`transaction_no\` varchar(100) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`bank_code\` varchar(50) NULL, \`status\` enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING', \`payment_response\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_f5221735ace059250daac9d980\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`order_code\` varchar(50) NOT NULL, \`user_id\` int NOT NULL, \`total_amount\` decimal(12,2) NOT NULL, \`status\` enum ('PENDING', 'PROCESSING', 'PAID', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING', \`payment_method\` enum ('VNPAY', 'PAYOS', 'COD') NOT NULL, \`is_flash_sale\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e462c2f2237b3049aa6be3fce0\` (\`order_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`product_id\` int NOT NULL, \`order_id\` int NOT NULL, \`quantity\` int NOT NULL, \`unit_price\` decimal(12,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`description\` text NULL, \`original_price\` decimal(12,2) NOT NULL, \`stock_quantity\` int NOT NULL DEFAULT '0', \`imageUrl\` varchar(500) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_34f6ca1cd897cc926bdcca1ca3\` (\`sku\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`flash_sale_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`product_id\` int NOT NULL, \`flash_sale_id\` int NOT NULL, \`flash_sale_price\` decimal(12,2) NOT NULL, \`sold_quantity\` int NOT NULL DEFAULT '0', \`allocated_stock\` int NOT NULL, \`limit_per_user\` int NOT NULL DEFAULT '1', UNIQUE INDEX \`IDX_ae6abc4cc6f74bde25c715aa54\` (\`flash_sale_id\`, \`product_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`flash_sale_events\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(150) NOT NULL, \`start_time\` datetime NOT NULL, \`end_time\` datetime NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`payment\` ADD CONSTRAINT \`FK_f5221735ace059250daac9d9803\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_145532db85752b29c57d2b7b1f1\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_9263386c35b6b242540f9493b00\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`flash_sale_items\` ADD CONSTRAINT \`FK_985532d0cb708b5f0905bcb2c98\` FOREIGN KEY (\`flash_sale_id\`) REFERENCES \`flash_sale_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`flash_sale_items\` ADD CONSTRAINT \`FK_b9545502793be460c1686ebbc58\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`flash_sale_items\` DROP FOREIGN KEY \`FK_b9545502793be460c1686ebbc58\``);
        await queryRunner.query(`ALTER TABLE \`flash_sale_items\` DROP FOREIGN KEY \`FK_985532d0cb708b5f0905bcb2c98\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_9263386c35b6b242540f9493b00\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_145532db85752b29c57d2b7b1f1\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\``);
        await queryRunner.query(`ALTER TABLE \`payment\` DROP FOREIGN KEY \`FK_f5221735ace059250daac9d9803\``);
        await queryRunner.query(`DROP TABLE \`flash_sale_events\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae6abc4cc6f74bde25c715aa54\` ON \`flash_sale_items\``);
        await queryRunner.query(`DROP TABLE \`flash_sale_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_34f6ca1cd897cc926bdcca1ca3\` ON \`product\``);
        await queryRunner.query(`DROP TABLE \`product\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_e462c2f2237b3049aa6be3fce0\` ON \`orders\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP INDEX \`REL_f5221735ace059250daac9d980\` ON \`payment\``);
        await queryRunner.query(`DROP TABLE \`payment\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
