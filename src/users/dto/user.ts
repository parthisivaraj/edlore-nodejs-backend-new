import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsMobilePhone,
  IsArray,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { PaginationResponse, SearchParamsDTO } from '@app/schema/dto';
import { Transform } from 'class-transformer';
import { SupportAvailabilityStatus, User } from '@app/schema';

export class UserRoleDto {
  id: string;
  title: string;
  description: string;
  status: string;
  permissions: PermissionDto[];
  created_at: string;
}

export class PermissionDto {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export class UserResponseDto {
  @IsString({ message: 'Please enter a valid user id' })
  user_id: string;

  @IsNotEmpty({ message: 'Please enter a valid first name' })
  @IsString()
  first_name: string;

  @IsNotEmpty({ message: 'Please enter a valid last name' })
  @IsString()
  last_name: string;

  @IsNotEmpty({ message: 'Please enter a valid username' })
  @IsString()
  username: string;

  @IsEmail(
    {},
    {
      message:
        'Please ensure the email address entered is valid and try again.',
    },
  )
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsMobilePhone(
    null,
    {},
    {
      message:
        'Please ensure the mobile number entered is a valid phone number and try again',
    },
  )
  mobile_number?: string;

  @IsOptional()
  @IsString()
  identification_code?: string;

  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive';

  @IsEnum(['Online', 'Away', 'Offline', 'busy'])
  support_availability_status: 'Online' | 'Away' | 'Offline' | 'busy';

  @IsString()
  created_at: string;

  @IsString()
  full_name: string;

  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  updated_at?: string;

  image?: string;

  @IsOptional()
  role?: UserRoleDto;
}

export class UsersResponse {
  users: UserResponseDto[];
  pagination: PaginationResponse;
  filters: any;
  message: string;
}

export class UserGroupFilterDto {
  @IsOptional()
  @IsArray()
  user_roles?: string[];

  @IsOptional()
  @IsArray()
  avail_status?: number[];
}

export class UserSearchParams extends SearchParamsDTO {
  @IsOptional()
  @Transform(({ value }) => {
    return value ? JSON.parse(value) : {};
  })
  filters?: UserGroupFilterDto;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'undefined' || value === '' ? null : value === 'true',
  )
  active: boolean;
}

export class ChangeStatusDTO {
  @Transform(({ value }) => Number(value)) // Convert the incoming string to a number
  @IsEnum(SupportAvailabilityStatus)
  support_availability_status: SupportAvailabilityStatus;
}

export class UpdateRoleDTO {
  @IsString()
  id: string;

  @IsString()
  role_id: string;
}

export class UpdatePasswordDTO {
  @IsString()
  id: string;

  @IsString()
  password: string;

  @IsString()
  password_confirmation: string;
}

export class CurrentUserUpdatePasswordDTO {
  @IsString()
  current_password: string;

  @IsString()
  password: string;

  @IsString()
  password_confirmation: string;
}

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsMobilePhone()
  mobile_number: string;

  @IsOptional()
  @IsString()
  identification_code?: string;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) =>
    value === '' || value === null ? false : value === 'true' || value === 1,
  )
  password_renewed: boolean;

  @IsString()
  password: string;

  @IsString()
  password_confirmation: string;

  // @IsNotEmpty()
  // @IsArray()
  // user_roles_attributes: { role_id: string }[];

  // @IsOptional()
  // image?: string;

  @IsBoolean()
  @Transform(({ value }) =>
    value === '' || value === null ? false : value === 'true' || value === 1,
  )
  @IsNotEmpty()
  status: boolean;

  @IsString()
  @IsNotEmpty()
  org_id: string;
  role_id: string;
}
export class UpdateUserDTO {
  @IsUUID()
  @IsOptional()
  id: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  @IsMobilePhone()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  identification_code?: string;

  image?: Express.Multer.File; // Optional image file
}

export class UpdateUserResponse {
  user: User;
}
