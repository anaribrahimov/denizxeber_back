import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1788591482606 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`users\` (
      \`id\`                int(11) unsigned NOT NULL AUTO_INCREMENT,
      \`first_name\`        varchar(100) NOT NULL,
      \`last_name\`         varchar(100) NOT NULL,
      \`email\`             varchar(255) NOT NULL,
      \`password\`          varchar(255) NOT NULL,
      \`role_id\`           tinyint unsigned NOT NULL,
      \`lang_ids\`          JSON NOT NULL,
      \`created_at\`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`        datetime NULL ON UPDATE CURRENT_TIMESTAMP,
      \`deleted_at\`        datetime NULL,
      \`is_active\`         boolean NULL DEFAULT 1,
      \`profile_image_id\`  bigint unsigned NULL,
      UNIQUE INDEX \`IDX_users_email\` (\`email\`),
      UNIQUE INDEX \`IDX_users_profile_image_id\` (\`profile_image_id\`),
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT,
      FOREIGN KEY (\`profile_image_id\`) REFERENCES \`uploads\`(\`id\`) ON DELETE SET NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_users_profile_image_id\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }

}
