import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('banner_names')
export class BannerName {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  name: string;
}
