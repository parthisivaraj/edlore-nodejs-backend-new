import { PaginationResponse, SearchParamsDTO } from '@app/schema/dto';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { StepResponseDto } from 'src/step/dto/add-edit';

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
  @Type(() => StepResponseDto)
  steps: StepResponseDto[];

  // @IsOptional()
  // steps?: string[];

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
  filters: any;
}

export class ProcedureDetailsResponse {
  message: string;
  procedure: ProcedureResponseDto;
}

class ModelGroupFilterDto {
  @IsOptional()
  @IsArray()
  models?: string[];
}

export class ProcedureSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => {
    return value ? JSON.parse(value) : {};
  })
  filters?: ModelGroupFilterDto;
}
