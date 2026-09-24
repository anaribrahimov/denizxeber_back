import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTable1790135888749 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE uploads
      ADD COLUMN file_width           INT UNSIGNED NULL,
      ADD COLUMN file_height          INT UNSIGNED NULL,
      ADD COLUMN thumb_path           VARCHAR(512) NULL,
      ADD COLUMN thumb_width          INT UNSIGNED NULL,
      ADD COLUMN thumb_height         INT UNSIGNED NULL,
      ADD COLUMN thumb_size_in_bytes  BIGINT UNSIGNED NULL,
      ADD COLUMN duration_in_sec      BIGINT UNSIGNED NULL,
      ADD UNIQUE INDEX UQ_uploads_thumb_path (thumb_path);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE uploads 
      DROP INDEX UQ_uploads_thumb_path,
      DROP COLUMN file_width,
      DROP COLUMN file_height,
      DROP COLUMN thumb_path,
      DROP COLUMN thumb_width,
      DROP COLUMN thumb_size_in_bytes,
      DROP COLUMN duration_in_sec,
      DROP COLUMN thumb_height;`
    );
  }

}
