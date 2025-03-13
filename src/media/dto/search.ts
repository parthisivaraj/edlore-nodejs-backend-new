import { SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';

export class MediaFilterDto {
  @IsOptional()
  @IsArray()
  media_type: string[];
}

export class MediaSearchParams extends SearchParamsDTO {
  @IsOptional()
  model_id: string;

  @IsOptional()
  organization_id: string;

  @IsOptional()
  type_id: string;

  @IsOptional()
  type: string;

  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : {}))
  filters?: MediaFilterDto;
}
