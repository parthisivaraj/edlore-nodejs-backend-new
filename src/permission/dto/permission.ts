import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class PermissionSearchParams {
  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  limit: number;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  page: number;

  @IsString()
  @IsOptional()
  role_id?: string;
}

export class PermissionResponseDTO {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export class PaginatedPermissionResponse {
  permissions: PermissionResponseDTO[];
  pagination: {
    total_entries: number;
    current_page: number;
    per_page: number;
    offset: number;
  };
  //   admin_id: string;
  //   tablet_id: string;
}
