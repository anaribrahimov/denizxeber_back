import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({
    type: 'tinyint',
    unsigned: true,
  })
  id: number;

  @Index('IDX_roles_name', { unique: true })
  @Column({
    name: 'name',
    type: 'varchar',
    length: 50,
  })
  name: string;
}
