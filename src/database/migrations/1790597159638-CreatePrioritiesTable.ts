import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrioritiesTable1790597159638 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`priorities\` (
        \`id\` tinyint NOT NULL AUTO_INCREMENT,
        \`name\` varchar(45) NOT NULL,
        UNIQUE INDEX \`IDX_priorities_name\` (\`name\`), 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `INSERT INTO \`priorities\` (\`id\`, \`name\`) VALUES
        (1, 'Updating'),
        (2, 'Updated')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`priorities\``);
  }

}
