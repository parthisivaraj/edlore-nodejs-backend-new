import { Entity, Column, ManyToOne } from 'typeorm';
import { SafetyMeasure } from './safety-measure.entity';
import { BaseEntity } from './base.entity';

@Entity('safety_measure_users')
export class SafetyMeasureUser extends BaseEntity {
  @Column({ nullable: false })
  userId: number;

  @ManyToOne(
    () => SafetyMeasure,
    (safetyMeasure) => safetyMeasure.safety_measure_users,
  )
  safety_measure: SafetyMeasure;
}
