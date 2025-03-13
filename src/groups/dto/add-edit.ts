import { GroupStatus } from '@app/schema';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddEditRequestDTO {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(GroupStatus)
  @IsOptional()
  status?: GroupStatus;

  @IsArray()
  @IsOptional()
  user_groups_attributes: UserGroupsAttribute[];
}

export class UserGroupsAttribute {
  @IsString()
  @IsOptional()
  user_id: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsBoolean()
  @IsOptional()
  _destroy?: boolean;
}
