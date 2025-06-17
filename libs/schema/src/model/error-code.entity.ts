import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Model } from './model.entity';
import { ErrorCodeLinking } from './error-code-linking.entity';
import { AssetNote } from './asset-note.entity';
import { WorkOrderTodo } from './work-order-todo.entity';
import { AttachedMedia } from './attached-media.entity';
import { ErrorCodeMachineType } from './error-code-machine-type.entity';

export enum ErrorCodeType {
  error_codes = 1,
  mcodes,
  alarm_codes,
}

@Entity('error_codes')
export class ErrorCode extends BaseEntity {
  @Column({ type: 'varchar', length: 150, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ErrorCodeType })
  error_type: ErrorCodeType;

  @ManyToOne(() => Model, (model) => model.errorCodes)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @OneToMany(() => ErrorCodeLinking, (linking) => linking.errorCode, {
    cascade: true,
  })
  errorCodeLinkings: ErrorCodeLinking[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.errorCode, {
    cascade: true,
  })
  assetNotes: AssetNote[];

  @OneToMany(() => WorkOrderTodo, (todo) => todo.taskable_id, { cascade: true })
  workOrderTodos: WorkOrderTodo[];

  @OneToMany(
    () => ErrorCodeMachineType,
    (machineType) => machineType.errorCode,
    { cascade: true },
  )
  errorCodeMachineTypes: ErrorCodeMachineType[];

  @OneToMany(() => AttachedMedia, (attachedMedia) => attachedMedia.step, {
    cascade: true,
  })
  attached_medias: AttachedMedia[];

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;
}
