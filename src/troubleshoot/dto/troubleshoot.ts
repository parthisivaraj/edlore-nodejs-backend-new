import { ApprovalStatus } from '@app/schema';
import {
  PaginationResponse,
  CommonStepsDTO,
  StepsAttribute,
} from '@app/schema/dto';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';

export class TroubleshootDetailResponseDto {
  message: string;
  troubleshoot: TroubleshootResponseDto;
}

export class TroubleshootResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  model_id: string;

  @IsOptional()
  troubleshoot_steps: CommonStepsDTO[];

  @IsNumber()
  steps_count: number;

  @IsString()
  steps_approval: string;

  @IsOptional()
  error_code_linkings?: number;

  @IsOptional()
  work_order_todos?: number;

  @IsOptional()
  asset_notes?: number;

  @IsString()
  created_at: string;

  @IsOptional()
  updated_at?: string;

  @IsOptional()
  is_deleted?: boolean;
}

export class TroubleshootResponse {
  pagination: PaginationResponse;
  troubleshoots: TroubleshootResponseDto[];

  @IsString()
  message: string;
}
export class AddEditTroubleshootDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  model_id?: string;

  @IsArray()
  troubleshoot_steps_attributes?: StepsAttribute[];
}

export class ApprovalStatusTroubleshootDto {
  @IsString()
  trouble_shoot_cause_id: string;

  @IsEnum(ApprovalStatus)
  approval_status: ApprovalStatus;
}
