import { SketchType } from '@app/schema';
import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddEditRequestDTO {
  @IsString()
  title: string;

  @IsEnum(SketchType)
  @IsOptional()
  sketch_type: SketchType;

  @IsString()
  @IsOptional()
  new_section_id?: string;

  @IsArray()
  @IsOptional()
  attached_medias_attributes: AttachedMediasAttribute[];
}
