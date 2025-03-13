import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AttachedMediasAttribute {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  active_storage_attachment_id?: string;

  @IsBoolean()
  @IsOptional()
  _destroy?: boolean;
}

export class StepsAttribute {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  step_order: number;

  @IsBoolean()
  @IsOptional()
  _destroy?: boolean;

  @IsArray()
  @IsOptional()
  attached_medias_attributes: AttachedMediasAttribute[];
}
