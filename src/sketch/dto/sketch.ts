import {
  PaginationResponse,
  SearchParamsDTO,
  AttachedMediaDTO,
} from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class SketchResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  sketch_type: string;

  @IsString()
  section_id: string;

  @IsString()
  created_at: string;

  @IsOptional()
  @IsNumber()
  linked_medias: number | null;

  @IsOptional()
  @IsString()
  section_title: string | null;

  @IsOptional()
  attached_medias: AttachedMediaDTO[];
}

export class SectionSketchResponseDto {
  id: string;
  title: string;
  sketch_type: string;
  linked_medias: number | null;
}

export class SketchDetaiDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  sketch_type: string;

  @IsOptional()
  attached_medias: AttachedMediaDTO[];
}

export class SketchDetailResponseDto {
  message: string;
  sketch: SketchDetaiDto;
}
export class SketchResponse {
  pagination: PaginationResponse;
  sketches: SketchResponseDto[];
  filters: any;
}

export class SectionSketchResponse {
  pagination: PaginationResponse;
  sketches: SectionSketchResponseDto[];
}

export class SketchFilterDto {
  @IsOptional()
  @IsArray()
  sections: string[];
}

export class SketchSearchParams extends SearchParamsDTO {
  // @IsOptional()
  // @IsNumber()
  // type: number;

  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : {}))
  filters?: SketchFilterDto;
}
