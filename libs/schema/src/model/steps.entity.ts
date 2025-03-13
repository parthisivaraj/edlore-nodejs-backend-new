import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Procedure } from './procedure.entity';
import { WrittenIssue } from './written-issue.entity';
import { AttachedMedia } from './attached-media.entity';
import { AssetNote } from './asset-note.entity';

@Entity('steps')
export class Step extends BaseEntity {
  @Column()
  stepable_type: string;

  @Column()
  stepable_id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  step_order: number;

  @Column({ type: 'json' })
  parameters: any;

  @ManyToOne(() => Procedure, (procedure) => procedure.steps, {
    nullable: true,
  })
  @JoinColumn({ name: 'stepable_id' })
  procedure: Procedure;

  @ManyToOne(() => WrittenIssue, (writtenIssue) => writtenIssue.steps)
  @JoinColumn({ name: 'stepable_id' })
  writtenIssue: WrittenIssue;

  @OneToMany(() => AttachedMedia, (media) => media.step, {
    cascade: true,
  })
  attached_medias: AttachedMedia[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.step, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assetNotes: AssetNote[];
}
