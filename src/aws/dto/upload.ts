import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDTO {
  @IsString()
  @IsNotEmpty()
  ext: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  extras?: object;
}
