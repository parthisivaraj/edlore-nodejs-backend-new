import { PaginationResponse, SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class PermissionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  created_at: string;
}

export class UserRoleResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  status: string;

  @IsArray()
  permissions: PermissionDto[];

  @IsString()
  created_at: string;

  // @IsArray()
  // permissions: string[];
  // title: string;
}

export class UserRoleResponse {
  roles: UserRoleResponseDto[];
  pagination: PaginationResponse;
  filters: any;
  // message: string;
}

export class UserRoleFilterDto {
  @IsOptional()
  @IsArray()
  role_permissions?: string[];

  @IsOptional()
  @IsArray()
  status?: number[];
}

export class UserRoleSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => {
    return value ? JSON.parse(value) : {};
  })
  filters?: UserRoleFilterDto;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    return value === 'undefined' || (value || '').trim() === ''
      ? null
      : value === 'true';
  })
  active: boolean;

  @IsString()
  @IsOptional()
  user_id?: string;
}

export class CreateUserRoleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  permissions: string[];
}
