import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { ErrorCode } from './error-code.entity';

@Entity('error_code_machine_types')
export class ErrorCodeMachineType extends BaseEntityWithoutDelete {
  @ManyToOne(() => ErrorCode, (errorCode) => errorCode.errorCodeMachineTypes)
  @JoinColumn({ name: 'error_code_id' })
  errorCode: ErrorCode;

  @Column({ type: 'varchar', length: 100, nullable: false })
  machine_type: string;
}
