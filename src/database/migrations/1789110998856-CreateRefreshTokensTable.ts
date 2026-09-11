import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokensTable1789110998856 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\`                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\`                     INT(11) UNSIGNED NOT NULL,
        \`token_hash\`                  VARCHAR(255) NOT NULL,
        \`user_agent\`                  VARCHAR(255) NULL,
        \`ip_address\`                  VARCHAR(255) NULL,
        \`revoked\`                     TINYINT(1) NOT NULL DEFAULT 0,
        \`replaced_by_token_hash\`      VARCHAR(255) NULL,
        \`expires_at\`                  DATETIME NOT NULL,
        \`created_at\`                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_refresh_tokens_token_hash\` (\`token_hash\`),
        INDEX \`IDX_refresh_tokens_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_refresh_tokens_user_id\`
          FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS \`refresh_tokens\`
    `);
  }
}
