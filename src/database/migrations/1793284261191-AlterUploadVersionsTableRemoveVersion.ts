import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadVersionsTableRemoveVersion1793284261191 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table \`upload_versions\`
      modify column \`version\` varchar(50) not null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

}
