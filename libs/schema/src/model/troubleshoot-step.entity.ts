import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Troubleshoot } from './troubleshoot.entity';
import { AttachedMedia } from './attached-media.entity';
import { AssetNote } from './asset-note.entity';

export enum ApprovalStatus {
  waiting = 1,
  approved,
  denied,
}

@Entity('troubleshoot_steps')
export class TroubleshootStep extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  step_order: number;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.approved,
    name: 'approval_status',
  })
  approvalStatus: ApprovalStatus;

  @ManyToOne(
    () => Troubleshoot,
    (troubleshoot) => troubleshoot.troubleshootSteps,
  )
  @JoinColumn({ name: 'troubleshoot_id' })
  troubleshoot_id: Troubleshoot;

  @OneToMany(
    () => AttachedMedia,
    (attachedMedia) => attachedMedia.troubleshootStep,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  attached_medias: AttachedMedia[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.troubleshootStep, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assetNotes: AssetNote[];
}
