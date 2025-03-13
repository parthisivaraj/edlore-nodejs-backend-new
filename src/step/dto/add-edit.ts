import { AttachedMediaDTO } from '@app/schema/dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StepResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  step_order: number;

  @IsOptional()
  parameters?: {
    skip: boolean;
  };

  @IsOptional()
  attached_medias: AttachedMediaDTO[]; // Adjust type as needed
}

export class AddStepDTO {
  @IsString()
  stepable_type: string;

  @IsString()
  stepable_id: string;

  @IsString()
  description: string;

  @IsString()
  title: string;

  @IsOptional()
  step_order: string;

  media: any[];
}
