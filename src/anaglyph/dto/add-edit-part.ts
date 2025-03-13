import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsOptional, IsString } from 'class-validator';

export class AddEditPartRequestDTO {
  @IsOptional()
  partId: string;

  @IsOptional()
  anaglyph_id: string;

  @IsOptional()
  part_name: string;

  @IsOptional()
  part_id: string;

  @IsOptional()
  purchase_url: string;

  @IsOptional()
  layer_id: string;

  @IsOptional()
  part_description: string;

  @IsOptional()
  attached_medias_attributes: AttachedMediasAttribute[];
}

export class AddEditPartNoteRequestDTO {
  @IsString()
  description: string;
}
