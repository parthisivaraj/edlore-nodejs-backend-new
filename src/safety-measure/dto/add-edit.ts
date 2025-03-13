import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddEditRequestDTO {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  model_id: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  id: string;

  @IsArray()
  @IsOptional()
  attached_medias_attributes: AttachedMediasAttribute[];
}
