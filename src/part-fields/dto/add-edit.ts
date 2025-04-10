import { IsString, IsNotEmpty, IsIP } from 'class-validator';

export class CreateUpdatePartFieldsDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
