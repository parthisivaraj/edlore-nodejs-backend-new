import { ErrorCodeType } from '@app/schema';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddEditErrorCodeDTO {
  @IsString()
  title: string;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsEnum(ErrorCodeType)
  error_type: ErrorCodeType;

  @IsArray()
  @IsOptional()
  error_code_linkings_attributes: ErrorCodeLinkingsAttribute[];

  @IsArray()
  @IsOptional()
  error_code_machine_type_attributes: ErrorCodeMachineTypeAttribute[];
}

export class ErrorCodeLinkingsAttribute {
  @IsString()
  linkable_type: string;

  @IsString()
  @IsOptional()
  linkable_id: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsBoolean()
  @IsOptional()
  _destroy?: boolean;
}

export class ErrorCodeMachineTypeAttribute {
  @IsString()
  machine_type: string;

  @IsString()
  @IsOptional()
  id: string;

  @IsBoolean()
  @IsOptional()
  _destroy?: boolean;
}

export class LinkProceduresRequest {
  @IsArray()
  linked_procedure_ids: string[];
}

export class LinkTroubleshootsRequest {
  @IsArray()
  linked_troubleshoot_ids: string[];
}
