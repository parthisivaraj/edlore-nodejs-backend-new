import { IsString, IsNotEmpty, IsIP } from 'class-validator';

export class CreateUpdateSlaveMachineDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIP()
  ipaddress: string;
}
