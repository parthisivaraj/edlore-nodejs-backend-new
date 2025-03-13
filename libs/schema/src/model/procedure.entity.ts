import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Model } from './model.entity';
import { Step } from './steps.entity';
import { BaseEntity } from './base.entity';
import { ErrorCodeLinking } from './error-code-linking.entity';

@Entity('procedures')
export class Procedure extends BaseEntity {
  @Column({ length: 150, unique: true, nullable: false })
  name: string;

  @Column()
  solution_prefix: string;

  @ManyToOne(() => Model, (model) => model.procedures)
  @JoinColumn({ name: 'model_id' })
  model_id: Model;

  @OneToMany(() => Step, (step) => step.procedure, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  steps: Step[];

  @OneToMany(
    () => ErrorCodeLinking,
    (errorCodeLinking) => errorCodeLinking.procedure,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  errorCodeLinkings: ErrorCodeLinking[];
}
