import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Model } from './model.entity';
import { Step } from './steps.entity';
import { BaseEntity } from './base.entity';

@Entity('deskprocedures')
export class DeskProcedure extends BaseEntity {
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

  // @OneToMany(() => Step, (step) => step.procedure)
  // steps: Step[];
  model: { id: string };
}
