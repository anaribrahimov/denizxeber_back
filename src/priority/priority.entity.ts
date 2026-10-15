import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('priorities')
export class Priority {

  @PrimaryColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: false,
    unique: true
  })
  name: string;
}
