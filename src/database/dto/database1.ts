import { IsArray, IsString } from 'class-validator';

export class CreateDatabaseDTO {
  @IsString()
  name: string;
}

export class TextContentDTO {
  @IsString()
  text: string;

  @IsString()
  pageNumber: string;

  @IsString()
  filename: string;
}

export class DocumentContentDTO {
  @IsArray()
  textContents: TextContentDTO[];

  @IsString()
  url: string;
}

export class RemoveDatabaseDocumentDTO {
  @IsString()
  id: string;

  @IsString()
  url: string;
}
