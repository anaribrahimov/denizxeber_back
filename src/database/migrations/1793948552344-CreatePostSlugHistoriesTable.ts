import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostSlugHistoriesTable1793948552344 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`post_slug_histories\` (
        \`id\`                  bigint NOT NULL AUTO_INCREMENT,
        \`post_id\`             bigint NOT NULL,
        \`slug\`                varchar(300) NOT NULL,
        \`created_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE RESTRICT,
        UNIQUE INDEX \`UK_psh_slug\` (\`slug\`)
      ) ENGINE=InnoDB`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`post_slug_histories\``);
  }

}
