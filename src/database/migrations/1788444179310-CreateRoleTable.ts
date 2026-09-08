import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoleTable1788521116110 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`roles\` (
        \`id\`                tinyint unsigned NOT NULL AUTO_INCREMENT,
        \`name\`              varchar(50) NOT NULL,
        UNIQUE INDEX \`IDX_roles_name\` (\`name\`), 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `INSERT INTO \`roles\` (\`id\`, \`name\`) VALUES
        (1, 'Admin'),
        (2, 'User')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_roles_name\` ON \`roles\``);
    await queryRunner.query(`DROP TABLE \`roles\``);
  }

}
