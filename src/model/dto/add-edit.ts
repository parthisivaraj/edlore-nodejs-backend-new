import { WhichCategory } from '@app/schema';
import { IsEnum, IsNotEmpty, IsUUID, Length } from 'class-validator';

export class AddModelDTORequest {
  @IsNotEmpty({ message: 'Category should be present' })
  @IsEnum(WhichCategory)
  which_category: WhichCategory;

  @IsNotEmpty({ message: 'Title should be present' })
  @Length(1, 150, { message: 'Maximum of 150 characters allowed' })
  title: string;

  @IsNotEmpty({ message: 'ID should be present' })
  @Length(1, 150, { message: 'Maximum of 150 characters allowed' })
  model_id: string;

  @IsNotEmpty({ message: 'Category should be present' })
  @IsUUID()
  category_id: string;
}

export class EditModelDTORequest extends AddModelDTORequest {
  @IsNotEmpty({ message: 'Category should be present' })
  @IsUUID()
  id: string;
}
