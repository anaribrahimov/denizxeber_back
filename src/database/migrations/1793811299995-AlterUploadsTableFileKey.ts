import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTableFileKey1793811299995 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`uploads\`
      modify column file_key varchar(300) not null`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`alter table \`uploads\`
      modify column file_key varchar(255) not null`);
  }

}
