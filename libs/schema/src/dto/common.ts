import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchParamsDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_column?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase()) // Converts value to uppercase
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginationResponse {
  total_entries: number;
  current_page: number;
  per_page: number;
  offset: number;
}

export class AttachedMediaDTO {
  id: string;
  active_storage_attachment_id: string;
  url: string;
  blob: ActiveStorageBlob;
}

class ActiveStorageBlob {
  title: string;
  thumb_url: string;
  file_name: string;
  content_type: string;
}

export interface CommonStepsDTO {
  id: string;
  title: string;
  description: string;
  step_order: number;
  user_id?: string;
  approval_status?: string;
  medias?: AttachedMediaDTO[];
  attached_medias?: AttachedMediaDTO[];
}
export class JwtUserPayload {
  id: string;
}
