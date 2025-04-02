import { AttachedMediaDTO, PaginationResponse } from '@app/schema/dto';
import { IsString, IsEnum, IsObject } from 'class-validator';

export class SectionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  created_at: string;
}

export class ThumbUrlDisplayDto {
  @IsString()
  id: string;

  @IsString()
  url: string;

  @IsString()
  title: string;

  @IsString()
  anaglyph_thumbnail: string;

  @IsString()
  active_storage_attachment_id: string;
}

export class AnaglyphResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsObject()
  section: SectionDto;

  @IsObject()
  thumb_url_display: ThumbUrlDisplayDto | null;

  @IsEnum(['active', 'inactive'])
  status: string;

  @IsString()
  created_at: string;

  parts_count: number;
}

export class AnaglyphResponse {
  pagination: PaginationResponse;
  anaglyph: AnaglyphResponseDto[];
  message: string;
}

export class AnaglyphDetailResponseDTO {
  anaglyph: AnaglyphDetailDTO;
  message: string;
}

export class AnaglyphDetailDTO extends AnaglyphResponseDto {
  purchase_link: any;
  media: ThumbUrlDisplayDto;
  parts: PartDTO[];
  thumbnail_attached: boolean;
}

export interface PartMedia {
  id: string;
  url: string;
  active_storage_attachment_id: string;
}

export class PartDTO {
  id: string;
  part_name: string;
  part_id: string;
  layer_id: string;
  part_description: string;
  purchase_url: string;
  manufacturer_code: any;
  nsn_number: any;
  quantity: any;
  nomenclature: any;
  medias: PartMedia[];
  dynamic_fields:any;
  created_at: string;
}

export interface PartResposeDTO {
  pagination: PaginationResponse;
  parts: PartDTO[];
  message: string;
}

export interface PartDetailsResposeDTO {
  part: PartDTO;
  message: string;
}

export class PartFieldsDTO {
  id: string;
  name: string;
}

export class PartFieldsResponseDTO {
  part_fields: string;
  message: string;
}