import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Section } from './section.entity';
import { AttachedMedia } from './attached-media.entity';
import { AssetNote } from './asset-note.entity';
import { Model } from './model.entity';
import { Media } from './media.entity';

export enum SketchType {
  manuals = 1,
  device_drawing,
  animation,
}

@Entity('sketches')
export class Sketch extends BaseEntity {
  @Column({ length: 150, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  parameters: string;

  @Column({
    type: 'enum',
    enum: SketchType,
    default: SketchType.manuals,
    nullable: false,
  })
  sketch_type: SketchType;

  @ManyToOne(() => Section, (section) => section.sketches, {
    eager: true,
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column()
  model_id: string;

  @ManyToOne(() => Model, (model) => model.sketches)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.sketch, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attached_medias: AttachedMedia[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.sketch)
  assetNotes: AssetNote[];

  @OneToMany(() => Media, (media) => media.sketch)
  linkedMedias: Media[];
}
