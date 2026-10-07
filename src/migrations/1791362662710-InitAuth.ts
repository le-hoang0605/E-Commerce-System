import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuth1791362662710 implements MigrationInterface {
    name = 'InitAuth1791362662710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`otp_tokens\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(6) NOT NULL, \`expires_at\` datetime NOT NULL, \`is_used\` tinyint NOT NULL DEFAULT 0, \`user_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`is_verified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`otp_tokens\` ADD CONSTRAINT \`FK_7003728e208144a06a974b2dbe2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`otp_tokens\` DROP FOREIGN KEY \`FK_7003728e208144a06a974b2dbe2\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_verified\``);
        await queryRunner.query(`DROP TABLE \`otp_tokens\``);
    }

}
