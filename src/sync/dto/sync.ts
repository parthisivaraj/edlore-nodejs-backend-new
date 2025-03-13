// dto/update-sync.dto.ts
import { IsObject, IsOptional } from 'class-validator';

export class UpdateSyncDto {
  @IsObject()
  @IsOptional()
  data: Record<string, any>;
}
