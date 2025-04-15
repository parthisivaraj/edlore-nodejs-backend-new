import { IsNumber, IsString } from 'class-validator';

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

export class CreateAWSMediaDTO {
  @IsString()
  media_title: string;
  @IsString()
  media_type: string;
  @IsString()
  original_file_name: string;
  @IsString()
  mime_type: string;
  @IsNumber()
  byte_size: number;
  @IsString()
  key: string;
}

export class CreateUnityAWSMediaDTO extends CreateAWSMediaDTO {
  @IsString()
  mediable_type: string;
  @IsString()
  mediable_id: string;
}
