import {
  CommonStepsDTO,
  PaginationResponse,
  SearchParamsDTO,
} from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class SectionItem {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  created_at: string;
}

export class FilterItem {
  @IsString()
  name: string;

  @IsString()
  param: string;

  @IsArray()
  items: SectionItem[];
}

export class Filters {
  @IsArray()
  applicable_filters: FilterItem[];

  @IsOptional()
  selected_filters: {
    [key: string]: string[];
  };
}

export class WrittenIssueResponseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  solution_count: number;

  @IsString()
  section_id: string;

  @IsString()
  section_title: string;

  @IsString()
  created_at: string;
}

export class WrittenIssueResponse {
  pagination: PaginationResponse;

  @IsArray()
  written_issues: WrittenIssueResponseDto[];

  filters?: any;
}

export class WrittenIssueFilterDto {
  @IsOptional()
  @IsArray()
  sections: string[];
}

export class WrittenIssueDetailDto {
  id: string;
  name: string;
  section_id: string;
  steps: CommonStepsDTO[];
}

export class WrittenIssueDetailResponseDto {
  message: string;
  written_issues: WrittenIssueDetailDto;
}

export class WrittenIssueSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : {}))
  filters?: WrittenIssueFilterDto;
}
