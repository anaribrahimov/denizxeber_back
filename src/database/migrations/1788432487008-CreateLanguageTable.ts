import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLanguageTable1788432487008 implements MigrationInterface {
  name = 'CreateLanguageTable1788432487008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`languages\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(10) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `INSERT INTO \`languages\` (\`id\`, \`name\`) VALUES
        (1, 'AZ'),
        (2, 'EN'),
        (3, 'RU'),
        (4, 'TR'),
        (5, 'KZ'),
        (6, 'TM')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (['production', 'prod', 'stage'].includes(env)) {
      throw new Error('Cannot revert migration in production or stage environment');
    }
    await queryRunner.query(`DROP TABLE IF EXISTS \`languages\``);
  }

}
