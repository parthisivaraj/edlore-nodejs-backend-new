import { IsString, IsNotEmpty } from 'class-validator';

export class AddEditRealiseNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
