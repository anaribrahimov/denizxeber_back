import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBannersTable1792560107351 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`banners\` (
        \`id\`                  int NOT NULL AUTO_INCREMENT,
        \`banner_name_id\`      int NOT NULL,
        \`lang_id\`             int NOT NULL,
        \`cover_image_id\`      bigint unsigned not null,
        \`link\`                varchar(512) NULL,
        \`created_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`banner_name_id\`) REFERENCES \`banner_names\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`lang_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`cover_image_id\`) REFERENCES \`uploads\`(\`id\`) ON DELETE RESTRICT,
        UNIQUE INDEX \`UK_banners_lid_bnid\` (\`lang_id\`, \`banner_name_id\`),
        INDEX \`IDX_banners_lang\` (\`lang_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`banners\``);
  }

}
