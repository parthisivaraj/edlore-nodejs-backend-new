import {
  PaginationResponse,
  SearchParamsDTO,
  AttachedMediaDTO,
} from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class SafetyMeasureResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  created_at: string;

  @IsString()
  last_updated: string;

  @IsString()
  media_count: number;
}

export class SafetyMeasureDetailsResponseDto extends SafetyMeasureResponseDto {
  @IsString()
  description: string;

  @IsString()
  enabled: string;

  attached_medias: AttachedMediaDTO[];
}

export class SafetyMeasureDetailResponseDto {
  message: string;
  safety_measure: SafetyMeasureDetailsResponseDto;
}

export class FilterItem {
  id: number;
  title: string;
}

export class SafetyMeasureResponse {
  safety_measures: SafetyMeasureResponseDto[];
  pagination: PaginationResponse;
  filters: SafetyMeasureFilters;
  message: string;
}

export class SafetyMeasureFilters {
  @IsOptional()
  @IsArray()
  status?: string[];

  @IsOptional()
  media_count?: number[];
}

export class SafetyMeasureFilterDto {
  @IsOptional()
  @IsArray()
  status: string[];
}

export class SafetyMeasureSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : {}))
  filters?: SafetyMeasureFilterDto;
}
