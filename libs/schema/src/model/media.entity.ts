import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Step } from './steps.entity';
import { Sketch } from './sketch.entity';

@Entity('media')
export class Media extends BaseEntity {
  @Column()
  activeStorageAttachmentId: string;

  @Column()
  url: string;

  @Column()
  title: string;

  @Column()
  thumbUrl: string;

  @Column()
  fileName: string;

  @Column()
  contentType: string;

  @ManyToOne(() => Step, (step) => step.attached_medias)
  step: Step;

  @ManyToOne(() => Sketch, (sketch) => sketch.attached_medias)
  @JoinColumn({ name: 'sketch_id' })
  sketch: Sketch;
}
