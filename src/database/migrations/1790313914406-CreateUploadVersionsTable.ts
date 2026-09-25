import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUploadVersionsTable1790313914406 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`create table \`upload_versions\` (
      \`id\`                   bigint unsigned NOT NULL AUTO_INCREMENT,
      \`upload_id\`            bigint unsigned NOT NULL,
      \`version\`              enum('small', 'medium', 'large') not null default 'small',
      \`file_name\`            varchar(100) not null,
      \`file_mimetype\`        varchar(100) not null,
      \`file_key\`             varchar(255) not null,
      \`file_width\`           int UNSIGNED null,
      \`file_height\`          int UNSIGNED null,
      \`file_size_byte\`       int unsigned null,
      PRIMARY KEY (\`id\`),
      FOREIGN KEY (\`upload_id\`) REFERENCES \`uploads\`(\`id\`) ON DELETE RESTRICT,
      UNIQUE INDEX \`uk_upload_versions_file_key\` (\`file_key\`),
      UNIQUE INDEX \`uk_upload_versions_file_name\` (\`file_name\`),
      UNIQUE INDEX \`uk_upload_versions_ui_v\` (\`upload_id\`, \`version\`),
      INDEX \`idx_upload_versions_upload_id\` (\`upload_id\`)
    ) ENGINE=InnoDB;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE \`upload_versions\``);
  }

}
