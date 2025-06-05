import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Model } from './model.entity';
import { AttachedMedia } from './attached-media.entity';
import { Section } from './section.entity';
import { Part } from './part.entity';
import { AssetNote } from './asset-note.entity';

@Entity('anaglyphs')
export class Anaglyph extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  purchase_link: string;

  @Column({ length: 150, nullable: false })
  title: string;

  @Column({ nullable: false, default: 1 })
  status: number;

  @ManyToOne(() => Model, (model) => model.anaglyphs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.anaglyph, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attached_medias: AttachedMedia[];

  @OneToMany(() => Part, (part) => part.anaglyph, { cascade: true })
  parts: Part[];

  @OneToOne(() => Section, (section) => section.anaglyphs, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @OneToMany(() => AssetNote, (assetNote) => assetNote.anaglyph)
  assetNotes: AssetNote[];
}
