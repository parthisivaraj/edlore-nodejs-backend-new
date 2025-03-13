import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Section } from './section.entity';
import { Model } from './model.entity';
import { Step } from './steps.entity';
import { AssetNote } from './asset-note.entity';
import { AttachedMedia } from './attached-media.entity';

@Entity('written_issues')
export class WrittenIssue extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  solution_prefix: string;

  @ManyToOne(() => Section, (section) => section.writtenIssues, {
    eager: true,
  })
  @JoinColumn({ name: 'section_id' })
  section_id: Section;

  @ManyToOne(() => Model, (model) => model.writtenIssues)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @OneToMany(() => Step, (step) => step.writtenIssue, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  steps: Step[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.writtenIssue)
  assetNotes: AssetNote[];

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.sketch, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attached_medias: AttachedMedia[];
}
