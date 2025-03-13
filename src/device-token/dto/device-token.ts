import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeviceTokenDTO {
  @IsNotEmpty()
  @IsString()
  device_token: string;
}
