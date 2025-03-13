import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AssetDetailsDTOResponse,
  AssetListDTOResponse,
  AssetNoteDTO,
  SearchDTO,
} from './dto/list';
import { AssetNote, AttachedMedia } from '@app/schema';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import { MediaService } from 'src/media/media.service';
import { CommonStepService } from '@app/schema/service';
import { AddEditNoteDTO } from './dto/asset-notes';

@Injectable()
export class AssetNotesService {
  constructor(
    @InjectRepository(AssetNote)
    private readonly assetNoteRepository: Repository<AssetNote>,

    private dataSource: DataSource,
    private mediaService: MediaService,
    private commonStepService: CommonStepService,
  ) {}

  private async convertToDTO(note: AssetNote) {
    const response = new AssetNoteDTO();
    response.asset_notiable_id = note.asset_notiable_id;
    response.asset_notiable_type = note.asset_notiable_type;
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
    response.task_id = note.task_id;
    response.title = note.title;
    response.user_email = 'hardik0207@gmail.com'; // TODO
    return response;
  }

  async get(params: SearchDTO): Promise<AssetListDTOResponse> {
    const queryBuilder = this.assetNoteRepository
      .createQueryBuilder('asset_notes')
      .leftJoinAndSelect('asset_notes.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where(
        'asset_notes.asset_notiable_type = :type AND asset_notes.asset_notiable_id = :id',
        {
          type: params.asset_notiable_type,
          id: params.asset_notiable_id,
        },
      )
      .andWhere('asset_notes.is_deleted = :isDeleted', { isDeleted: false });

    if (params.search) {
      AssetNote.search(queryBuilder, params.search);
    }

    // Sorting functionality
    if (params.sort_column && params.sort_order) {
      const sortColumn =
        params.sort_column === 'title'
          ? 'asset_notes.title'
          : `asset_notes.${params.sort_column}`;
      queryBuilder.orderBy(sortColumn, params.sort_order);
    } else {
      queryBuilder.orderBy('asset_notes.updated_at', 'DESC');
    }

    // Handle pagination
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
      notes: await Promise.all(
        notes.map((measure) => this.convertToDTO(measure)),
      ),
    };
  }

  async getById(id: string): Promise<AssetDetailsDTOResponse> {
    const note = await this.assetNoteRepository
      .createQueryBuilder('asset_notes')
      .leftJoinAndSelect('asset_notes.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('asset_notes.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('asset_notes.id = :id', { id })
      .getOne();
    console.log('🚀 ~ AssetNotesService ~ getById ~ note:', note);

    return {
      message: 'Success',
      note: await this.convertToDTO(note),
    };
  }

  async create(data: AddEditNoteDTO): Promise<AssetDetailsDTOResponse> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assetNote = queryRunner.manager.create(AssetNote, {
        ...data,
      });
      await queryRunner.manager.save(assetNote);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        assetNote.id,
        'AssetNote',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      const response = await this.getById(assetNote.id);

      return response;
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
  ): Promise<AssetDetailsDTOResponse> {
    const assetNote = await this.assetNoteRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!assetNote) {
      throw new NotFoundException(`Safety Measure with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(assetNote, {
        ...data,
      });
      await queryRunner.manager.save(AssetNote, assetNote);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        id,
        'AssetNote',
      );
      await queryRunner.commitTransaction();

      const response = await this.getById(assetNote.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<AssetDetailsDTOResponse> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assetNote = await queryRunner.manager.findOne(AssetNote, {
        where: { id },
      });

      if (!assetNote) {
        throw new NotFoundException(`Written Issue with id ${id} not found`);
      }

      await queryRunner.manager.update(
        AssetNote,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(AttachedMedia, {
        mediable_id: id,
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return {
        message: 'Deleted Successfully',
        note: { title: assetNote.title } as any,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
