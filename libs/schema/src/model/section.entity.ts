import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sketch } from './sketch.entity';
import { Anaglyph } from './anaglyph.entity';
import { Model } from './model.entity';
import { WrittenIssue } from './written-issue.entity';

@Entity('sections')
export class Section extends BaseEntity {
  @Column({ length: 150, nullable: false })
  title: string;

  @ManyToOne(() => Model, (model) => model.sections)
  @JoinColumn({ name: 'model_id' })
  model_id: Model;

  @OneToMany(() => WrittenIssue, (writtenIssue) => writtenIssue.section_id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  writtenIssues: WrittenIssue[];

  @OneToMany(() => Sketch, (sketch) => sketch.section, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  sketches: Sketch[];

  @OneToMany(() => Anaglyph, (anaglyph) => anaglyph.section)
  anaglyphs: Anaglyph[];
}
