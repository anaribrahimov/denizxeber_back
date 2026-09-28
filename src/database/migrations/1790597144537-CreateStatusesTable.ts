import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStatusesTable1790597144537 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`statuses\` (
        \`id\` tinyint NOT NULL AUTO_INCREMENT,
        \`name\` varchar(45) NOT NULL,
        UNIQUE INDEX \`IDX_statuses_name\` (\`name\`), 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `INSERT INTO \`statuses\` (\`id\`, \`name\`) VALUES
        (1, 'Published'),
        (2, 'Draft')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`statuses\``);
  }

}
