import { PaginationResponse } from '@app/schema/dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MediaDTO {
  id: string;
  file_name: string;
  content_type: string;
  title: string;
  file_type: string;
  url: string;
  thumb_url: string;
}

export class MediaResponse {
  pagination: PaginationResponse;
  medias: MediaDTO[];
  filters: any;
  message: string;
}

export class UpdateMediaDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsString()
  content_type?: string;

  @IsOptional()
  @IsString()
  file_type?: string;
}
