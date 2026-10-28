import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterSubscribersTableAddUnsubscribeTokenColumn1793190928944 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`subscribers\`
      add column \`unsubscribe_token\`         varchar(100) not null,
      add unique index \`UK_subscribers_unsubscribe_token\` (\`unsubscribe_token\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE \`subscribers\`
      drop index \`UK_subscribers_unsubscribe_token\`,
      drop column \`unsubscribe_token\`;
    `);
  }

}
