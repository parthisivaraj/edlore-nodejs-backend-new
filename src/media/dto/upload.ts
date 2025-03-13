import { IsString } from 'class-validator';

export class UploadFileParams {
  @IsString()
  original_file_name: string;

  @IsString()
  organization_id: string;

  @IsString()
  media_type: string;

  @IsString()
  media_title: string;
}

export class SaveMediaDTO {
  media_title: string;
  media_type: string;
  record_id: string;
  record_type: string;
  name: string;
}

export class CreateMediaDTO {
  @IsString()
  mediable_type: string;
  @IsString()
  mediable_id: string;
  @IsString()
  media_title: string;
  @IsString()
  media_type: string;
}
