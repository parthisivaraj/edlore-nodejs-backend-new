import {
  AttachedMediaDTO,
  PaginationResponse,
  SearchParamsDTO,
} from '@app/schema/dto';
import { IsString, IsOptional } from 'class-validator';

export class SearchDTO extends SearchParamsDTO {
  @IsString()
  @IsOptional()
  asset_notiable_type: string;

  @IsString()
  @IsOptional()
  asset_notiable_id: string;
}

export class AssetNoteDTO {
  id: string;
  title: string;
  description: string;
  asset_notiable_type: string;
  asset_notiable_id: string;
  media_count: number;
  task_id: string;
  user_email: string;
  created_at: string;
  attached_medias: AttachedMediaDTO[];
}

export class AssetListDTOResponse {
  notes: AssetNoteDTO[];
  pagination: PaginationResponse;
  message: string;
}

export class AssetDetailsDTOResponse {
  note: AssetNoteDTO;
  message: string;
}
