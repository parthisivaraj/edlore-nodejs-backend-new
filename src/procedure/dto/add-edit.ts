import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StepsAttribute } from '@app/schema/dto';

export class AddProcedureDTORequest {
  @IsString()
  @IsNotEmpty({ message: 'Enter Name' })
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepsAttribute)
  @IsOptional()
  steps_attributes?: StepsAttribute[];
}
export class EditProcedureDTORequest {
  @IsString()
  @IsOptional()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepsAttribute)
  @IsOptional()
  steps_attributes: StepsAttribute[];

  @IsNotEmpty({ message: 'Procedure should be present' })
  @IsOptional()
  procedure_id?: string;

  @IsString()
  @IsOptional()
  model_id?: string;
}
