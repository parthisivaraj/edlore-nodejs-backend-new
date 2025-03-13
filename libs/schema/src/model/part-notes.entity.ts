import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { Part } from './part.entity';

@Entity('part_notes')
export class PartNotes extends BaseEntityWithoutDelete {
  @Column({ nullable: false })
  part_id: string;

  @Column({ nullable: false })
  description: string;

  @ManyToOne(() => Part, (part) => part.assetNotes)
  @JoinColumn({ name: 'part_id' })
  part: Part;

  static search(queryBuilder, keyword: string) {
    const escapedKeyword = keyword.replace(
      /[!@#$%^&*()=\[\]{}|;:,./<>?\\']/g,
      '\\$&',
    );
    return queryBuilder.andWhere('LOWER(notes.description) ILIKE :search', {
      search: `%${escapedKeyword}%`,
    });
  }
}
