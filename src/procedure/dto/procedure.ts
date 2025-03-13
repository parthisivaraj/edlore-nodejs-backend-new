import { CommonStepsDTO, PaginationResponse } from '@app/schema/dto';
import {
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class FilterItem {
  @IsString()
  name: string;

  @IsString()
  param: string;

  @IsArray()
  items: {
    id: string | number;
    title: string;
  }[];
}

export class ProcedureResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  name: string;

  @IsString()
  model_id: string;

  @IsOptional()
  @ValidateNested({ each: true })
  steps: CommonStepsDTO[];

  @IsNumber()
  steps_count: number;

  @IsNumber()
  media_count: number;

  @IsString()
  created_at: string;
}

export class ProcedureResponse {
  pagination: PaginationResponse;
  procedures: ProcedureResponseDto[];
  @IsString()
  message: string;
}

export class ProcedureDetailsDTO {
  id: string;
  name: string;
  steps: CommonStepsDTO[];
}

export class ProcedureDetailsResponse {
  message: string;
  procedure: ProcedureDetailsDTO;
}
