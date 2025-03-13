import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { Device } from './devices.entity';
import { Procedure } from './procedure.entity';
import { Section } from './section.entity';
import { Troubleshoot } from './troubleshoot.entity';
import { WrittenIssue } from './written-issue.entity';
import { SafetyMeasure } from './safety-measure.entity';
import { ErrorCode } from './error-code.entity';
import { Sketch } from './sketch.entity';
import { Anaglyph } from './anaglyph.entity';

export enum WhichCategory {
  'primary' = 1,
  'secondary',
}

@Entity('models')
export class Model extends BaseEntity {
  @Column({ unique: true, nullable: false })
  model_id: string;

  @Column({ length: 150, unique: true, nullable: false })
  title: string;

  @Column({ type: 'enum', enum: WhichCategory, nullable: false })
  which_category: WhichCategory;

  @ManyToOne(() => Category, (category) => category.models, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category_id: Category;

  @OneToMany(() => Device, (device) => device.model_id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  devices: Device[];

  @OneToMany(() => Procedure, (procedure) => procedure.model_id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  procedures: Procedure[];

  @OneToMany(() => Section, (section) => section.model_id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  sections: Section[];

  @OneToMany(() => Troubleshoot, (troubleshoot) => troubleshoot.model_id)
  troubleshoots: Troubleshoot[];

  @OneToMany(() => WrittenIssue, (writtenIssue) => writtenIssue.model, {
    cascade: true,
  })
  writtenIssues: WrittenIssue[];

  @OneToMany(() => SafetyMeasure, (safetyMeasure) => safetyMeasure.model_id, {
    cascade: true,
  })
  safetyMeasures: SafetyMeasure[];

  @OneToMany(() => ErrorCode, (errorCode) => errorCode.model, { cascade: true })
  errorCodes: ErrorCode[];

  @OneToMany(() => Sketch, (sketch) => sketch.model, { cascade: true })
  sketches: Sketch[];

  @OneToMany(() => Anaglyph, (anaglyph) => anaglyph.model)
  anaglyphs: Anaglyph[];
}
