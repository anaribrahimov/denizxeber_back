import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUploadTable1788591482605 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`uploads\` (
      \`id\`                        bigint unsigned NOT NULL AUTO_INCREMENT,
      \`type\`                      ENUM('private', 'public') NOT NULL DEFAULT 'public',
      \`file_original_name\`        VARCHAR(255) NOT NULL,
      \`file_name\`                 varchar(255) NOT NULL,
      \`file_path\`                 varchar(500) NOT NULL,
      \`mime_type\`                 varchar(100) NOT NULL,
      \`file_size_in_bytes\`        BIGINT UNSIGNED NOT NULL,
      \`created_at\`                datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`deleted_at\`                datetime NULL,
      UNIQUE INDEX \`IDX_uploads_file_path\` (\`file_path\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_uploads_file_path\` ON \`uploads\``);
    await queryRunner.query(`DROP TABLE \`uploads\``);
  }

}
