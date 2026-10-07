import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostsTable1790910814579 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`posts\` (
        \`id\`                  bigint NOT NULL AUTO_INCREMENT,
        \`category_id\`         int(11) unsigned NOT NULL,
        \`author_id\`           int(11) unsigned NOT NULL,
        \`status_id\`           tinyint NOT NULL,
        \`cover_image_id\`      bigint unsigned NULL,
        \`title\`               varchar(255) NOT NULL,
        \`slug\`                varchar(300) NOT NULL,
        \`content\`             longtext NOT NULL,
        \`view_count\`          int(11) unsigned NOT NULL DEFAULT 0,
        \`last_updated_by_id\`  int(11) unsigned NULL,
        \`created_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\`          datetime NULL DEFAULT NULL,
        \`sort_at\`             datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`is_updating\`         boolean NOT NULL DEFAULT false,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`last_updated_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`status_id\`) REFERENCES \`statuses\`(\`id\`) ON DELETE RESTRICT,
        FOREIGN KEY (\`cover_image_id\`) REFERENCES \`uploads\`(\`id\`) ON DELETE RESTRICT,
        UNIQUE INDEX \`UK_posts_slug\` (\`slug\`),
        INDEX \`IDX_posts_category_status_deleted_updating_sort\`
          (\`category_id\`, \`status_id\`, \`deleted_at\`, \`is_updating\`, \`sort_at\`),
        INDEX \`IDX_posts_category_slug_deleted\` (\`category_id\`, \`slug\`, \`deleted_at\`)
      ) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`posts\``);
  }

}
