import {
  AttachedMediaDTO,
  PaginationResponse,
  SearchParamsDTO,
} from '@app/schema/dto';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Procedure {
  link_id: string;
  id: string;
  title: string;
  steps_count: number;
}

export class Troubleshoot {
  link_id: string;
  id: string;
  title: string;
  steps_count: number;
}

export class ErrorCodeResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsNumber()
  procedure_count: number;

  @IsNumber()
  troubleshoot_count: number;

  @IsString()
  error_type: string;

  @IsString()
  created_at: string;

  @IsNumber()
  media_count: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Procedure)
  procedures: Procedure[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Troubleshoot)
  troubleshoots: Troubleshoot[];

  @IsOptional()
  attached_medias: AttachedMediaDTO[];
}

export class ErrorCodeResponse {
  pagination: PaginationResponse;
  message: string;

  @ValidateNested({ each: true })
  @Type(() => ErrorCodeResponseDto)
  errors: ErrorCodeResponseDto[];
}

export class ErrorDetailDTO {
  id: string;
  title: string;
  code: string;
  error_type: string;
  description: string;
  procedure_count: number;
  troubleshoot_count: number;
  created_at: string;
  media_count: number;
  procedures: Procedure[];
  troubleshoots: Troubleshoot[];
  attached_medias: AttachedMediaDTO[];
}

export class ErrorCodeDetailResponse {
  message: string;
  error: ErrorDetailDTO;
}

export class ListLinkingParamDTO extends SearchParamsDTO {
  @IsOptional()
  @IsString()
  type?: 'Troubleshoot' | 'Procedure';
}

export class ListLinkingDTO {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Procedure)
  procedures?: Procedure[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Troubleshoot)
  troubleshoots?: Troubleshoot[];

  pagination: PaginationResponse;
}

export class AllProcedureDTO {
  id: string;
  title: string;
}

export class AllProcedureResponseDTO {
  procedures: AllProcedureDTO[];
  linked_procedure_ids: string[];
  pagination: PaginationResponse;
}

export class AllTroubleshootDTO {
  id: string;
  title: string;
}

export class AllTroubleshootResponseDTO {
  troubleshoots: AllTroubleshootDTO[];
  linked_troubleshoot_ids: string[];
  pagination: PaginationResponse;
}
