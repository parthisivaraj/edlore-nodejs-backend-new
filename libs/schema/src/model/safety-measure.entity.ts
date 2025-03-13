import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

import { AssetNote } from './asset-note.entity';
import { Model } from './model.entity';
import { AttachedMedia } from './attached-media.entity';
import { SafetyMeasureUser } from './safety-measureUser.entity';
import { BaseEntity } from './base.entity';

@Entity('safety_measures')
export class SafetyMeasure extends BaseEntity {
  @Column({ length: 150, nullable: false })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  enabled: boolean;

  @ManyToOne(() => Model, (model) => model.safetyMeasures)
  @JoinColumn({ name: 'model_id' })
  model_id: Model;

  @OneToMany(
    () => AttachedMedia,
    (attachedMedia) => attachedMedia.safetyMeasure,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  attached_medias: AttachedMedia[];

  @OneToMany(() => SafetyMeasureUser, (user) => user.safety_measure, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  safety_measure_users: SafetyMeasureUser[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.safetyMeasure, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assetNotes: AssetNote[];
}
