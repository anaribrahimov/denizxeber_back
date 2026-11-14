import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadVersionsTableFileName1793811312092 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`upload_versions\`
      modify column file_name varchar(300) not null`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`alter table \`upload_versions\`
      modify column file_name varchar(100) not null`);
  }

}
