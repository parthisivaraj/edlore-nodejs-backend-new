import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FeedbackDTO {
  @IsNotEmpty()
  @IsString()
  experience: string;

  @IsOptional()
  @IsString()
  comment: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
