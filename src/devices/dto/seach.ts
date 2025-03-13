import { SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';

export class DeviceFilterDto {
  @IsOptional()
  @IsArray()
  models: string[];

  @IsOptional()
  @IsArray()
  status: string[];
}

export class DeviceSearchParams extends SearchParamsDTO {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  draft: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  active: boolean;

  @IsOptional()
  @Transform(({ value }) => (value ? JSON.parse(value) : {}))
  filters?: DeviceFilterDto;
}
