import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPostsTableTitleColumn1793258346738 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`posts\`
      modify column \`title\` varchar(600) not null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE \`posts\`
      modify column \`title\` varchar(255) not null
    `);
  }

}
