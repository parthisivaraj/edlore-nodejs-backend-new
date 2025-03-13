import { Section } from '@app/schema';
import { PaginationResponse } from '@app/schema/dto';
import { IsString } from 'class-validator';

export class SectionResponseDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  created_at: string;
}
export class SectionResponse {
  pagination: PaginationResponse;
  sections: SectionResponseDto[];
}

export class EditSectionResponse {
  message: string;
  section: Section;
}
