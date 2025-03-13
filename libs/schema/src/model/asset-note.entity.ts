import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Troubleshoot } from './troubleshoot.entity';
import { WrittenIssue } from './written-issue.entity';
import { Sketch } from './sketch.entity';
import { User } from './user.entity';
import { AttachedMedia } from './attached-media.entity';
import { TroubleshootStep } from './troubleshoot-step.entity';
import { SafetyMeasure } from './safety-measure.entity';
import { Step } from './steps.entity';
import { ErrorCode } from './error-code.entity';
import { Part } from './part.entity';
import { Anaglyph } from './anaglyph.entity';

@Entity('asset_notes')
export class AssetNote extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  asset_notiable_type: string;

  @Column()
  asset_notiable_id: string;

  @Column()
  user_id: string;

  @Column()
  task_id: string;

  @ManyToOne(() => User, (user) => user.asset_notes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.note, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attached_medias: AttachedMedia[];

  @ManyToOne(() => Troubleshoot, (troubleshoot) => troubleshoot.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  troubleshoot: Troubleshoot;

  @ManyToOne(() => TroubleshootStep, (troubleshoot) => troubleshoot.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  troubleshootStep: TroubleshootStep;

  @ManyToOne(() => SafetyMeasure, (safetyMeasure) => safetyMeasure.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  safetyMeasure: SafetyMeasure;

  @ManyToOne(() => Step, (step) => step.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  step: Step;

  @ManyToOne(() => ErrorCode, (errorCode) => errorCode.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  errorCode: ErrorCode;

  @ManyToOne(() => Part, (part) => part.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  part: Part;

  @ManyToOne(() => WrittenIssue, (writtenIssue) => writtenIssue.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  writtenIssue: WrittenIssue;

  @ManyToOne(() => Sketch, (sketch) => sketch.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  sketch: Sketch;

  @ManyToOne(() => Anaglyph, (anaglyph) => anaglyph.assetNotes)
  @JoinColumn({ name: 'asset_notiable_id' })
  anaglyph: Anaglyph;

  static search(queryBuilder, keyword: string) {
    const escapedKeyword = keyword.replace(
      /[!@#$%^&*()=\[\]{}|;:,./<>?\\']/g,
      '\\$&',
    );
    return queryBuilder.andWhere(
      'LOWER(asset_notes.title) ILIKE :search OR LOWER(asset_notes.description) ILIKE :search',
      { search: `%${escapedKeyword}%` },
    );
  }
}
