import { IsString, IsEnum, IsDate } from 'class-validator';

export enum WorkOrderTodoStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
}

export class WorkOrderTodoResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(WorkOrderTodoStatus)
  status: WorkOrderTodoStatus;

  @IsDate()
  dueDate: Date;
}
