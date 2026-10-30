import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadVersionsTableRemoveVersion1793284261191 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`upload_versions\`
      drop index \`uk_upload_versions_ui_v\`,
      drop column \`version\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE \`upload_versions\`
      add column \`version\` enum('small', 'medium', 'large') not null default 'small',
      add UNIQUE INDEX \`uk_upload_versions_ui_v\` (\`upload_id\`, \`version\`)
    `);
  }

}
