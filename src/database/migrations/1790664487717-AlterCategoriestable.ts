import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterCategoriestable1790664487717 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table \`categories\`
      add column \`deleted_at\` datetime null;`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(
      `alter table \`categories\`
      drop column deleted_at`
    );
  }

}
