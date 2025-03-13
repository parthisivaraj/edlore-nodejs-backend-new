import { DeviceStatus, TaskType } from '@app/schema';
import { PaginationResponse } from '@app/schema/dto';
import {
  WorkOrderPriority,
  WorkOrderStatus,
} from '@app/schema/model/work-order.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

interface AssignedTo {
  group: {
    id: string;
    title: string;
  };
}
interface Device {
  id: string;
  name: string;
  device_id: string;
  serial_number: string;
  status: DeviceStatus;
  created_at: string;
  model: {
    id: any; //TODO REMOVE ANY
    model_id: any; //TODO REMOVE ANY
    title: any; //TODO REMOVE ANY
    which_category: any; //TODO REMOVE ANY
    primary_category: any; //TODO REMOVE ANY
    secondary_category: any; //TODO REMOVE ANY
  };
}
export class WorkOrderResponseDto {
  @IsString()
  id: string;

  @IsString()
  work_order_number: string;

  @IsString()
  title: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  priority?: string;

  // @IsString()
  // created_user: string;

  // @IsOptional()
  // @IsString()
  // assigned_to?: string;

  @IsOptional()
  assigned_to?: AssignedTo;

  @IsOptional()
  @IsString()
  assigned_to_type?: string;

  // @IsOptional()
  // @IsString()
  // device?: string;

  @IsOptional()
  device?: Device;

  @IsString()
  created_at: string;

  @IsOptional()
  @IsString()
  repeat?: Boolean;

  @IsOptional()
  @IsString()
  created_at_formated?: string;

  @IsOptional()
  task_type?: TaskType;

  @IsOptional()
  @IsString()
  work_order_status?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  completed_task?: string | null;
}

export class WorkOrderResponse {
  pagination: PaginationResponse;
  work_orders: WorkOrderResponseDto[];
  message: string;
}
