import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AddEditCategoryDTO {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNotEmpty({ message: 'Organization is required' })
  @IsUUID('all', { message: 'org_id must be a valid UUID version 4' })
  org_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubCategoriesAttribute)
  sub_categories_attributes: SubCategoriesAttribute[];
}

export class EditCategoryDTO {
  @IsString()
  @IsOptional()
  name: string;

  @IsNotEmpty({ message: 'Organization is required' })
  @IsUUID('all', { message: 'org_id must be a valid UUID version 4' })
  org_id: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubCategoriesAttribute)
  sub_categories_attributes: SubCategoriesAttribute[];
}

export class SubCategoriesAttribute {
  @IsUUID('4')
  @IsOptional()
  id: string;

  @IsString()
  name: string;
}

export class DestoryDTO {
  @IsUUID('4')
  @IsOptional()
  new_category_id: string;
}
