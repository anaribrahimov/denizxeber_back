import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscribersTable1792583121732 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`subscribers\` (
        \`id\`                  int NOT NULL AUTO_INCREMENT,
        \`email\`               varchar(255) NOT NULL,
        \`lang_id\`             int NOT NULL,
        \`created_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`lang_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE RESTRICT,
        UNIQUE INDEX \`UK_subscribers_lang_email\` (\`lang_id\`, \`email\`),
        INDEX \`IDX_subscribers_lang\` (\`lang_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`subscribers\``);
  }

}
