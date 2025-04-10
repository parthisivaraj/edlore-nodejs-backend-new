import { IsString, IsNotEmpty, IsIP } from 'class-validator';

export class CreateUpdatePartFieldsMappingsDTO {
  @IsString()
  part_field_id: string;

  @IsString()
  part_id: string;
  
  @IsString()
  value: string;
}
