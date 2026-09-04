import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('languages')
export class Language {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 10, nullable: false })
  name: string;
}
