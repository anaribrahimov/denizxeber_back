import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRowNumberToCategoriesTable1794643095892 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`categories\`
      add column \`row_number\` int null`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`alter table \`categories\` drop column \`row_number\``);
  }

}
