import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GlobalSearchParams {
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  type?: string;
}
