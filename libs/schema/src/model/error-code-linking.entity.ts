import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { Troubleshoot } from './troubleshoot.entity';
import { ErrorCode } from './error-code.entity';
import { Procedure } from './procedure.entity';

export enum ErrorCodeLinkingType {
  'Procedure' = 'Procedure',
  'Troubleshoot' = 'Troubleshoot',
}

@Entity('error_code_linkings')
export class ErrorCodeLinking extends BaseEntityWithoutDelete {
  @Column()
  error_code_id: string;

  @Column({ type: 'enum', enum: ErrorCodeLinkingType, nullable: false })
  linkable_type: ErrorCodeLinkingType;

  @Column()
  linkable_id: string;

  @ManyToOne(
    () => Troubleshoot,
    (troubleshoot) => troubleshoot.errorCodeLinkings,
    { eager: true },
  )
  @JoinColumn({ name: 'linkable_id' })
  troubleshoot: Troubleshoot;

  @ManyToOne(
    () => Procedure,
    (troubleshoot) => troubleshoot.errorCodeLinkings,
    { eager: true },
  )
  @JoinColumn({ name: 'linkable_id' })
  procedure: Procedure;

  @ManyToOne(() => ErrorCode, (errorCode) => errorCode.errorCodeLinkings, {
    eager: true,
  })
  @JoinColumn({ name: 'error_code_id' })
  errorCode: ErrorCode;
}
