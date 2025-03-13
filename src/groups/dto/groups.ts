import { PaginationResponse, SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UserGroupResponseDto {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: string;
  user_count: number;
}

export class UserGroupFilterDto {
  @IsOptional()
  @IsArray()
  status?: string[];
}

export class UserGroupResponse {
  groups: UserGroupResponseDto[];
  pagination: PaginationResponse;
  filters: any;
  message: string;
}

export class UserGroupDetailDTO extends UserGroupResponseDto {
  selected_users: SelectedUser[];
}

export class SelectedUser {
  record_id: string;
  id: string;
}

export class UserGroupDetailsResponse {
  group: UserGroupDetailDTO;
}

export class GroupSearchParams extends SearchParamsDTO {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'undefined' || value === '' ? null : value === 'true',
  )
  active: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    return value ? JSON.parse(value) : {};
  })
  filters?: UserGroupFilterDto;
}

export class GetUserFilterDto {
  @IsOptional()
  @IsArray()
  status?: number[];

  @IsOptional()
  @IsArray()
  user_roles?: string[];

  @IsOptional()
  @IsArray()
  avail_status?: number[];
}

export class GetUserSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => {
    return value ? JSON.parse(value) : {};
  })
  filters?: GetUserFilterDto;
}

export class UserDTO {
  record_id?: string;
  id: string;
  created_at?: string;
  email: string;
  full_name: string;
}

export class GetUserResponse {
  users: UserDTO[];
  pagination: PaginationResponse;
  filters: any;
}
