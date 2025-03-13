import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddEditNoteDTO {
  @IsString()
  asset_notiable_type: string;

  @IsString()
  asset_notiable_id: string;

  @IsString()
  description: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  id: string;

  @IsArray()
  @IsOptional()
  attached_medias_attributes: AttachedMediasAttribute[];
}
