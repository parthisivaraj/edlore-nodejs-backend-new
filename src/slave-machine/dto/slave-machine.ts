import { IsString, IsOptional, IsDateString } from 'class-validator';

export class SlaveMachineDTO {
  id: string;
  name: string;
  ipaddress: string;
  is_syncing: boolean;

  @IsOptional()
  @IsString()
  sync_status: string;

  @IsOptional()
  @IsDateString()
  sync_start_at: Date;

  @IsOptional()
  @IsDateString()
  sync_end_at: Date;

  @IsOptional()
  @IsDateString()
  last_sync_at: Date;

  ping_status: boolean;
}
