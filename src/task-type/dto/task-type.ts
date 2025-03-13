import { PaginationResponse } from '@app/schema/dto';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class TaskTypeResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive';

  @IsNumber()
  active_work_orders: number;

  @IsString()
  created_at: string;

  @IsString()
  updated_at: string;
}

export class FilterItem {
  id: number;
  title: string;
}

export class FiltersResponse {
  applicable_filters: Array<{
    name: string;
    param: string;
    items: FilterItem[];
  }>;
  selected_filters: {
    status: number[];
  };
}

export class TaskTypeApiResponseDto {
  task_types: TaskTypeResponseDto[];
  pagination: PaginationResponse;
  filters: FiltersResponse;
  message: string;
}
