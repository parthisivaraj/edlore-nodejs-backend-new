import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { User } from './user.entity';
import { AttachedMedia } from './attached-media.entity';

@Entity('notes')
export class Note extends BaseEntityWithoutDelete {
  @Column({ length: 150, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'user_id', nullable: false })
  user_id: string;

  @Column({ type: 'boolean', default: false })
  is_edited: boolean;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.note, {
    cascade: true,
  })
  attached_medias: AttachedMedia[];

  static search(queryBuilder, keyword: string) {
    const escapedKeyword = keyword.replace(
      /[!@#$%^&*()=\[\]{}|;:,./<>?\\']/g,
      '\\$&',
    );
    return queryBuilder.andWhere(
      'LOWER(notes.title) ILIKE :search OR LOWER(notes.description) ILIKE :search OR LOWER(user.email) ILIKE :search',
      { search: `%${escapedKeyword}%` },
    );
  }
}
