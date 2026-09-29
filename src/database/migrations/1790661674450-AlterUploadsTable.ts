import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsTable1790661674450 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table \`uploads\` 
      drop index \`IDX_uploads_file_path\`,
      drop column \`file_path\`;`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

}
