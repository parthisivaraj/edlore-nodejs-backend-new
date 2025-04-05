import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Anaglyph } from './anaglyph.entity';
import { AttachedMedia } from './attached-media.entity';
import { BaseEntity } from './base.entity';
import { AssetNote } from './asset-note.entity';
import { PartNotes } from './part-notes.entity';

@Entity('parts')
export class Part extends BaseEntity {
  @Column({ nullable: false })
  part_name: string;

  @Column({ nullable: false })
  part_id: string;

  @Column({ nullable: false })
  layer_id: string;

  @Column({ nullable: false })
  part_description: string;

  @Column({ nullable: false })
  purchase_url: string;

  @Column({ nullable: false })
  nsn_number: string;

  @Column({ nullable: false })
  nomenclature: string;

  @Column({ nullable: false })
  manufacturer_code: string;

  @Column({ nullable: false })
  quantity: number;

  @Column('jsonb', { nullable: true })
  dynamic_fields: any;

  @Column('jsonb', { nullable: true })
  part_fields: any;


  @ManyToOne(() => Anaglyph, (anaglyph) => anaglyph.parts)
  @JoinColumn({ name: 'anaglyph_id' })
  anaglyph: Anaglyph;

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.part)
  attached_medias: AttachedMedia[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.part, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assetNotes: AssetNote[];

  @OneToMany(() => PartNotes, (assetNote) => assetNote.part, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  partNotes: PartNotes[];
}
