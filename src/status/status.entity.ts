import { Column, Entity } from "typeorm";

@Entity('statuses')
export class Status {

  @Column()
  id: number;

  @Column()
  name: string;
}
