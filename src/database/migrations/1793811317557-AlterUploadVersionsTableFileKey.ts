import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadVersionsTableFileKey1793811317557 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`upload_versions\`
      modify column file_key varchar(355) not null`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`alter table \`upload_versions\`
      modify column file_key varchar(200) not null`);
  }

}
