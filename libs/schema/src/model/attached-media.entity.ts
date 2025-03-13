import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ActiveStorageAttachment } from './active-storage-attachments.entity';
import { Step } from './steps.entity';
import { Sketch } from './sketch.entity';
import { SafetyMeasure } from './safety-measure.entity';
import { Anaglyph } from './anaglyph.entity';
import { Note } from './notes.entity';
import { TroubleshootStep } from './troubleshoot-step.entity';
import { Part } from './part.entity';
import { BaseEntity } from './base.entity';
import { WrittenIssue } from './written-issue.entity';
import { AssetNote } from './asset-note.entity';
import { Device } from './devices.entity';

@Entity('attached_media')
export class AttachedMedia extends BaseEntity {
  @Column()
  mediable_type: string;

  @Column()
  mediable_id: string;

  @ManyToOne(
    () => ActiveStorageAttachment,
    (activeStorageAttachment) => activeStorageAttachment.attached_media,
    {
      eager: true,
      nullable: true,
    },
  )
  @JoinColumn({ name: 'active_storage_attachment_id' })
  active_storage_attachment_id: ActiveStorageAttachment;

  @Column({ nullable: true })
  parameters: string;

  @Column({ nullable: true })
  file_type: string;

  @ManyToOne(() => Step, (step) => step.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  step: Step;

  @ManyToOne(() => Sketch, (sketch) => sketch.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  sketch: Sketch;

  @ManyToOne(
    () => WrittenIssue,
    (written_issue) => written_issue.attached_medias,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'mediable_id' })
  writtenIssue: WrittenIssue;

  @ManyToOne(
    () => SafetyMeasure,
    (safetyMeasure) => safetyMeasure.attached_medias,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'mediable_id' })
  safetyMeasure: SafetyMeasure;

  @ManyToOne(() => Anaglyph, (anaglyph) => anaglyph.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  anaglyph: Anaglyph;

  @ManyToOne(() => Note, (note) => note.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  note: Note;

  @ManyToOne(() => AssetNote, (note) => note.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  assetNote: AssetNote;

  @ManyToOne(
    () => TroubleshootStep,
    (troubleshootStep) => troubleshootStep.attached_medias,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'mediable_id' })
  troubleshootStep: TroubleshootStep;

  @ManyToOne(() => Part, (part) => part.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  part: Part;

  @ManyToOne(() => Step, (step) => step.attached_medias, {
    nullable: true,
  })
  @JoinColumn({ name: 'mediable_id' })
  device: Device;
}
