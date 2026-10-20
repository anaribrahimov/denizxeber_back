import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterCategoriesTable1790665850757 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table \`categories\` drop column \`is_active\`;`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(
      `alter table \`categories\`
      add column is_active boolean NULL DEFAULT true;`
    );
  }

}
