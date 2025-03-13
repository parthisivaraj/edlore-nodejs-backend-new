import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import { AttachedMedia, Note } from '@app/schema';
import { MediaService } from 'src/media/media.service';
import { JwtUserPayload, SearchParamsDTO } from '@app/schema/dto';
import {
  NoteDetailsDTOResponse,
  NoteDTO,
  NoteListDTOResponse,
} from './dto/list';
import { AddEditNoteDTO } from './dto/notes';
import { CommonStepService } from '@app/schema/service';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,

    private dataSource: DataSource,
    private mediaService: MediaService,
    private commonStepService: CommonStepService,
  ) {}

  private async convertToDTO(note: Note) {
    const response = new NoteDTO();
    response.id = note.id;
    response.attached_medias = await Promise.all(
      note.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
    response.created_at = DateUtilsService.dateToString(note.created_at); // Adjust formatting as necessary
    response.description = note.description;
    response.media_count = note.attached_medias.length || 0;
    response.title = note.title;
    return response;
  }

  async get(
    params: SearchParamsDTO,
    user: JwtUserPayload,
  ): Promise<NoteListDTOResponse> {
    const queryBuilder = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('note.user_id = :user_id', { user_id: user.id });

    if (params.search) {
      Note.search(queryBuilder, params.search);
    }

    if (params.sort_column && params.sort_order) {
      const sortColumn =
        params.sort_column === 'title'
          ? 'LOWER(note.title)'
          : `note.${params.sort_column}`;
      queryBuilder.orderBy(sortColumn, params.sort_order);
    } else {
      queryBuilder.orderBy('note.updated_at', 'DESC');
    }

    const take = !params.limit ? undefined : 10; // Set your desired pagination limit
    const skip = (params.page - 1) * take;
    const [notes, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount(); // Adjust skip based on your pagination logic

    return {
      message: 'Success',
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      Notes: await Promise.all(
        notes.map((measure) => this.convertToDTO(measure)),
      ),
    };
  }

  async getById(id: string): Promise<NoteDetailsDTOResponse> {
    const note = await this.noteRepository
      .createQueryBuilder('notes')
      .leftJoinAndSelect('notes.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .andWhere('notes.id = :id', { id })
      .getOne();
    return {
      message: 'Success',
      note: await this.convertToDTO(note),
    };
  }

  async create(data: AddEditNoteDTO, user: JwtUserPayload): Promise<NoteDTO> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const note = queryRunner.manager.create(Note, {
        ...data,
        user_id: user.id,
      });
      await queryRunner.manager.save(note);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        note.id,
        'Note',
      );

      await queryRunner.commitTransaction();
      const response = await this.getById(note.id);
      return response.note;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    data: AddEditNoteDTO,
  ): Promise<NoteDetailsDTOResponse> {
    const note = await this.noteRepository.findOne({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(note, {
        ...data,
      });
      await queryRunner.manager.save(Note, note);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        id,
        'Note',
      );
      await queryRunner.commitTransaction();

      const response = await this.getById(note.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<NoteDetailsDTOResponse> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const note = await queryRunner.manager.findOne(Note, {
        where: { id },
      });

      if (!note) {
        throw new NotFoundException(`Written Issue with id ${id} not found`);
      }

      const response = await this.getById(id);

      await queryRunner.manager.delete(Note, { id: id });

      await queryRunner.manager.delete(AttachedMedia, {
        mediable_id: id,
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully', note: response.note };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
