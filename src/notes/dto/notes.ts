import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddEditNoteDTO {
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
