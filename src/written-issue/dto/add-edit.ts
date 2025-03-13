import { StepsAttribute } from '@app/schema/dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddRequestDTO {
  @IsString()
  name: string;

  @IsString()
  model_id: string;

  @IsArray()
  steps_attributes: StepsAttribute[];
}

export class UpdateRequestDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  steps_attributes: StepsAttribute[];
}
