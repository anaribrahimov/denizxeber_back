import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('statuses')
export class Status {

  @PrimaryColumn({
    type: 'tinyint',
    unsigned: true,
  })
  id: number;

  @Column()
  name: string;
}
