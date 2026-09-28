import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1789383013156 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`categories\` (
      \`id\`                int(11) unsigned NOT NULL AUTO_INCREMENT,
      \`lang_id\`           int not null,
      \`name\`              varchar(100) NOT NULL,
      \`slug\`              varchar(255) NOT NULL,
      \`user_id\`           int(11) unsigned,
      \`created_at\`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`        datetime NULL ON UPDATE CURRENT_TIMESTAMP,
      \`is_active\`         boolean NULL DEFAULT true,
      FOREIGN KEY (\`lang_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE RESTRICT,
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
      UNIQUE INDEX \`UI_categories_lang_id_name\` (\`lang_id\`, \`name\`),
      UNIQUE INDEX \`UI_categories_lang_id_slug\` (\`lang_id\`, \`slug\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`categories\``);
  }

}
