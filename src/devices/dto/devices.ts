import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationResponse } from '@app/schema/dto';
import { DeviceStatus, Model } from '@app/schema';
import { Exclude, Transform } from 'class-transformer';
import { parse, format } from 'date-fns';
import { ModelResponseDto } from 'src/model/dto/model';

export class DeviceResponseDto {
  @IsString()
  id: string;

  @IsString()
  device_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  qr_code_url?: string;

  // @IsEnum(DeviceStatus)
  // status: DeviceStatus;
  @IsString()
  status: string;

  @IsOptional()
  @IsInt()
  procedure_count?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsString()
  created_at: string;

  model?: Model;
}

export class DeviceResponse {
  pagination: PaginationResponse;
  devices: DeviceResponseDto[];
  filters: any; //TODO REMOVE ANY
}

export class DeviceDetailsResponseDTO {
  id: string;
  name: string;
  serial_number: string;
  device_id: string;
  image: string;
  location: string;
  status: string;
  model: ModelResponseDto;
  category: string;
  width?: number;
  length?: number;
  depth?: number;
  manufactured_by: string;
  manufactured_date: string;
  last_repair_date: string;
  warranty_till: string;
  generated_qr: string;
  message: string;
}

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  manufactured_by: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : parseInt(value, 10))) // Convert to null or integer
  @IsInt({ message: 'Width must be an integer number' })
  width?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : parseInt(value, 10))) // Convert to null or integer
  @IsInt({ message: 'Depth must be an integer number' })
  depth?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : parseInt(value, 10))) // Convert to null or integer
  @IsInt({ message: 'Length must be an integer number' })
  length?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    try {
      const parsedDate = parse(value, 'MMM dd, yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      return format(parsedDate, 'yyyy-MM-dd');
    } catch (e) {
      return null;
    }
  })
  @IsDateString()
  manufactured_date?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    try {
      const parsedDate = parse(value, 'MMM dd, yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      return format(parsedDate, 'yyyy-MM-dd');
    } catch (e) {
      return null;
    }
  })
  @IsDateString()
  warranty_till?: string;

  @Transform(({ value }) => parseInt(value, 10)) // Convert to integer
  @IsEnum(DeviceStatus, {
    message: 'Status must be one of the following values: 1, 2',
  })
  status: DeviceStatus;
}

export class UpdateDeviceDto extends CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @Exclude()
  generate_qr: string;

  image?: Express.Multer.File;
}

export class ChangeStatusDeviceDto {
  @IsEnum(DeviceStatus)
  status: DeviceStatus;
}
