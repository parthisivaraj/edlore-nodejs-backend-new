import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Model } from './model.entity';

import { AssetNote } from './asset-note.entity';
import { TroubleshootStep } from './troubleshoot-step.entity';
import { ErrorCodeLinking } from './error-code-linking.entity';
import { WorkOrderTodo } from './work-order-todo.entity';

@Entity('troubleshoots')
export class Troubleshoot extends BaseEntity {
  @Column({ unique: true })
  title: string;

  @ManyToOne(() => Model, (model) => model.troubleshoots)
  @JoinColumn({ name: 'model_id' })
  model_id: Model;

  @OneToMany(() => TroubleshootStep, (step) => step.troubleshoot_id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  troubleshootSteps: TroubleshootStep[];

  @OneToMany(
    () => ErrorCodeLinking,
    (errorCodeLinking) => errorCodeLinking.troubleshoot,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  errorCodeLinkings: ErrorCodeLinking[];

  @OneToMany(() => WorkOrderTodo, (workOrderTodo) => workOrderTodo.taskable, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  workOrderTodos: WorkOrderTodo[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.troubleshoot, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assetNotes: AssetNote[];
}
