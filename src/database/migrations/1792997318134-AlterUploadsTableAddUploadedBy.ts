import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTableAddUploadedBy1792997318134 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`uploads\`
      add column \`uploaded_by\`         int(11) unsigned null,
      ADD CONSTRAINT fk_uploads_uploaded_by FOREIGN KEY (\`uploaded_by\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : '';
    if (!['development', 'dev', 'local'].includes(env)) {
      throw new Error('Migrations can be reverted in development, dev or local environment');
    }
    await queryRunner.query(`ALTER TABLE \`uploads\`
      drop foreign key \`fk_uploads_uploaded_by\`,
      drop column \`uploaded_by\`;
    `);
  }

}
