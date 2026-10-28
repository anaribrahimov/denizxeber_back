import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Language } from "../language/language.entity.js";

@Entity('subscribers')
@Index('UK_subscribers_lang_email', ['langId', 'email'], {
  unique: true,
})
@Index('IDX_subscribers_lang', ['langId'])
@Index('UK_subscribers_unsubscribe_token', ['unsubscribeToken'])
export class Subscriber {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'lang_id',
    type: 'int',
  })
  langId: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'unsubscribe_token',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  unsubscribeToken: string;

  /* ------------------------- Relations ------------------------- */

  @ManyToOne(() => Language, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'lang_id',
    referencedColumnName: 'id',
  })
  language: Language;
}
