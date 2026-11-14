import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTableDropUniqueIndexFileName1793811285245 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`uploads\`
      drop index \`idx_uploads_file_name\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`alter table \`uploads\`
      add unique index \`idx_uploads_file_name\` (\`file_name\`)`);
  }

}
