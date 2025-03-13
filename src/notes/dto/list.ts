import { AttachedMediaDTO, PaginationResponse } from '@app/schema/dto';

export class NoteDTO {
  id: string;
  title: string;
  description: string;
  media_count: number;
  created_at: string;
  attached_medias: AttachedMediaDTO[];
}

export class NoteListDTOResponse {
  Notes: NoteDTO[];
  pagination: PaginationResponse;
  message: string;
}

export class NoteDetailsDTOResponse {
  note: NoteDTO;
  message: string;
}
