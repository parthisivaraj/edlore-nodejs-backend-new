import { AttachedMediasAttribute } from '@app/schema/dto';
import { IsOptional, IsString } from 'class-validator';

export class AddEditRequestDTO {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  section_id?: string;

  @IsOptional()
  anaglyph_file_attributes: AttachedMediasAttribute;
}

export class UpdateThumbUrlDTO {
  delete?: string;
  active_storage_attachment_id?: string;
}

export class UpdateRequestDTO extends AddEditRequestDTO {
  @IsOptional()
  @IsString()
  anaglyph_id: string;

  @IsOptional()
  @IsString()
  purchase_link: string;
}
