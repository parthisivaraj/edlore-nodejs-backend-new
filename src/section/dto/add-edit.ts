import { IsNotEmpty, Length } from 'class-validator';

export class AddEditSectionDTORequest {
  @IsNotEmpty({ message: 'Title should be present' })
  @Length(1, 150, { message: 'Maximum of 150 characters allowed' })
  title: string;
}
