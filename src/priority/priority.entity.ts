import { Column, Entity } from "typeorm";

@Entity('priorities')
export class Priority {

  @Column()
  id: number;

  @Column()
  name: string;
}
