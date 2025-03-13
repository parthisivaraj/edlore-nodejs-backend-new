import { PaginationResponse, SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CategoryBaseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  model_count: number;
}

export class CategoryResponseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  model_count: number;

  @IsOptional()
  sub_categories?: CategoryBaseDto[];

  @IsString()
  created_at: string;
}

export class CategoryResponse {
  pagination?: PaginationResponse;
  message?: string;
  categories: CategoryResponseDto[];
}

export class SubCategoryResponse {
  secondary_categories: CategoryResponseDto[];
}

export class CategorySecondaryBriefDto extends CategoryBaseDto {
  @IsOptional()
  super_category?: CategoryBaseDto;
}

export class CategorySubDto extends CategoryBaseDto {
  @IsNumber()
  model_count: number;
}

export class CategorySearchParams extends SearchParamsDTO {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  primary_only: boolean;

  @IsString()
  @IsOptional()
  parent_id?: string;

  @IsString()
  @IsOptional()
  org_id?: string;
}

export class TabDeviceDto {
  id: string;
  name: string;
  serial_number: string;
  device_id: string;
  image: string;
  location: string;
  status: string;
  category: string;
  width: number;
  length: number;
  depth: number;
  manufactured_by: string;
  manufactured_date: string;
  last_repair_date: string;
  warranty_till: string;
  generated_qr: string;
  model: any;
}
