import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTable1790313914300 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`uploads\`
      modify column \`file_name\`                             varchar(100) not null,
      change column \`mime_type\` \`file_mimetype\`           varchar(100) not null,
      change column \`file_size_in_bytes\` \`file_size_byte\` bigint unsigned null,
      add column \`file_key\`                                 varchar(255) not null,
      add column \`file_width\`                               int unsigned null,
      add column \`file_height\`                              int unsigned null,
      add column \`duration_sec\`                             int unsigned null,
      add unique index \`idx_uploads_file_key\` (\`file_key\`),
      add unique index \`idx_uploads_file_name\` (\`file_name\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE \`uploads\`
      DROP INDEX \`idx_uploads_file_key\`,
      DROP INDEX \`idx_uploads_file_name\`,
      modify column \`file_name\`                             varchar(255) not null,
      change column \`file_mimetype\` \`mime_type\`           varchar(100) not null,
      change column \`file_size_byte\` \`file_size_in_bytes\` bigint unsigned null,
      drop column \`file_key\`,
      drop column \`file_width\`,
      drop column \`file_height\`,
      drop column \`duration_sec\`;
    `);
  }

}
