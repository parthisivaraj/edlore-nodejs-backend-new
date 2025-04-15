import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { SearchParamsDTO } from '@app/schema/dto';
import { DateUtilsService } from '@app/common-utils';
import {
  Anaglyph,
  AttachedMedia,
  Model,
  Note,
  Part,
  PartNotes,
  PartFields,
} from '@app/schema';
import * as fs from 'fs';
import * as csv from 'csv-parser';

import {
  AnaglyphResponseDto,
  AnaglyphResponse,
  AnaglyphDetailResponseDTO,
  AnaglyphDetailDTO,
  PartMedia,
  PartResposeDTO,
  PartDTO,
  PartDetailsResposeDTO,
  PartFieldsDTO,
  PartFieldsResponseDTO,
} from './dto/anaglyph';
import { MediaService } from 'src/media/media.service';
import {
  AddEditRequestDTO,
  UpdateRequestDTO,
  UpdateThumbUrlDTO,
} from './dto/add-edit';
import { CommonStepService, CustomUniqueService } from '@app/schema/service';
import {
  AddEditPartNoteRequestDTO,
  AddEditPartRequestDTO,
} from './dto/add-edit-part';
import axios from 'axios';

@Injectable()
export class AnaglyphService {
  constructor(
    @InjectRepository(Anaglyph)
    private readonly anaglyphRepository: Repository<Anaglyph>,
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
    @InjectRepository(PartNotes)
    private readonly partNotesRepository: Repository<PartNotes>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    @InjectRepository(AttachedMedia)
    private readonly attachedMediaRepository: Repository<AttachedMedia>,

    @InjectRepository(PartFields)
    private readonly partFieldsRepository: Repository<PartFields>,

    private dataSource: DataSource,
    private mediaService: MediaService,
    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private async convertToDTO(anaglyph: Anaglyph): Promise<AnaglyphResponseDto> {
    const response = new AnaglyphResponseDto();
    response.id = anaglyph.id.toString();
    response.title = anaglyph.title;
    response.created_at = DateUtilsService.dateToString(anaglyph.created_at);

    if (anaglyph.section) {
      response.section = {
        id: anaglyph.section.id.toString(),
        title: anaglyph.section.title,
        created_at: DateUtilsService.dateToString(anaglyph.section.created_at),
      };
    } else {
      response.section = null;
    }
    response.parts_count = anaglyph.parts.length;

    response.thumb_url_display = null;

    const thumbnail = anaglyph.attached_medias.find(
      (x) => x.file_type === 'thumb_url',
    );
    if (thumbnail && thumbnail.active_storage_attachment_id) {
      const media = await this.mediaService.convertAttachementDTO(thumbnail);
      response.thumb_url_display = {
        active_storage_attachment_id: media.active_storage_attachment_id,
        anaglyph_thumbnail: media.blob.thumb_url,
        id: media.id,
        title: media.blob.title,
        url: media.url,
      };
    }

    return response;
  }

  private async mediaDTO(media: AttachedMedia): Promise<PartMedia> {
    const temp = await this.mediaService.convertAttachementDTO(media);
    return {
      active_storage_attachment_id: temp.active_storage_attachment_id,
      id: temp.id,
      url: temp.url,
    };
  }

  private async convertToDetailsDTO(
    anaglyph: Anaglyph,
  ): Promise<AnaglyphDetailDTO> {
    const temp = await this.convertToDTO(anaglyph);
    const response: AnaglyphDetailDTO = {
      ...temp,
      purchase_link: anaglyph.purchase_link,
      media: null,
      parts: [],
      thumbnail_attached: !!temp.thumb_url_display?.id,
    };

    response.parts = await Promise.all(
      anaglyph.parts.map(async (part) => this.convertToPartDTO(part)),
    );
    response.media = null;

    const thumbnail = anaglyph.attached_medias.find(
      (x) => x.file_type === 'zip_file',
    );
    if (thumbnail && thumbnail.active_storage_attachment_id) {
      const media = await this.mediaService.convertAttachementDTO(thumbnail);
      response.media = {
        active_storage_attachment_id: media.active_storage_attachment_id,
        anaglyph_thumbnail: media.blob.thumb_url,
        id: media.id,
        title: media.blob.title,
        url: media.url,
      };
    }

    return response;
  }

  private async convertToPartFieldsDTO(partField: PartFields): Promise<PartFieldsDTO> {
    const temp = {
      id: partField.id,
      name: partField.name
    };
    return temp;
  }

  private async convertToPartDTO(part: Part): Promise<PartDTO> {
    const temp = {
      id: part.id,
      part_description: part.part_description,
      created_at: DateUtilsService.dateToString(part.created_at),
      layer_id: part.layer_id,
      manufacturer_code: part.manufacturer_code,
      medias: await Promise.all(
        (part.attached_medias || [])
          .filter((x) => x.active_storage_attachment_id)
          .map((attached_media) => this.mediaDTO(attached_media)),
      ),
      nomenclature: part.nomenclature,
      nsn_number: part.nsn_number,
      part_id: part.part_id,
      part_name: part.part_name,
      purchase_url: part.purchase_url,
      quantity: part.quantity,
      dynamic_fields: part.dynamic_fields,
      part_fields: part.part_fields,
    };
    return temp;
  }

  async get(
    modelId: string,
    params: SearchParamsDTO,
    admin: boolean,
  ): Promise<AnaglyphResponse> {
    let queryBuilder = this.anaglyphRepository
      .createQueryBuilder('anaglyph')
      .leftJoinAndSelect('anaglyph.section', 'section')
      .leftJoinAndSelect('anaglyph.parts', 'parts')
      .leftJoinAndSelect('anaglyph.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('anaglyph.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('anaglyph.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(anaglyph.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    const take = admin ? params.limit : 10000;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [anaglyphs, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      anaglyph: await Promise.all(
        anaglyphs.map((anaglyph) => this.convertToDTO(anaglyph)),
      ),
      message: 'Success',
    };
  }

  async getById(id: string): Promise<AnaglyphDetailResponseDTO> {
    const anaglyph = await this.anaglyphRepository
      .createQueryBuilder('anaglyph')
      .leftJoinAndSelect('anaglyph.section', 'section')
      .leftJoinAndSelect('anaglyph.parts', 'parts')
      .leftJoinAndSelect('parts.attached_medias', 'part_attached_medias')
      .leftJoinAndSelect(
        'part_attached_medias.active_storage_attachment_id',
        'part_active_storage_attachment_id',
      )
      .leftJoinAndSelect('part_active_storage_attachment_id.blob', 'part_blob')
      .leftJoinAndSelect('anaglyph.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('anaglyph.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('anaglyph.id = :id', { id })
      .getOne();

    if (!anaglyph) {
      throw new NotFoundException('anaglyph not found');
    }

    return {
      anaglyph: await this.convertToDetailsDTO(anaglyph),
      message: 'Success',
    };
  }

  async getPartsById(
    id: string,
    params: SearchParamsDTO,
  ): Promise<PartResposeDTO> {
    let queryBuilder = await this.partRepository
      .createQueryBuilder('parts')
      .leftJoinAndSelect('parts.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('parts.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('parts.anaglyph_id = :id', { id });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "(LOWER(parts.part_name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(parts.layer_id::text) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(parts.manufacturer_code) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(parts.nomenclature) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(parts.nsn_number) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(parts.part_description) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapedKeyword}%` },
      );
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [parts, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      parts: await Promise.all(
        parts.map(async (part) => this.convertToPartDTO(part)),
      ),
      message: 'Success',
    };
  }

  async getByPartId(id: string): Promise<PartDetailsResposeDTO> {
    const part = await this.partRepository
      .createQueryBuilder('parts')
      .leftJoinAndSelect('parts.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('parts.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('parts.id = :id', { id })
      .getOne();

    if (!part) {
      throw new NotFoundException('part not found');
    }

    return {
      part: await this.convertToPartDTO(part),
      message: 'Success',
    };
  }

  async create(modelId: string, data: AddEditRequestDTO) {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
    });

    // If the section is not found, throw an error
    if (!model) {
      throw new BadRequestException({
        error: `Model with ID ${modelId} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Anaglyph,
      'title',
      data.title,
      {
        model: { id: modelId },
      },
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const sectionHasAnalyph = await this.anaglyphRepository.findOne({
      where: {
        section: {
          id: data.section_id,
        },
        is_deleted: false,
      },
    });
    if (sectionHasAnalyph) {
      throw new BadRequestException(
        'The given section is associated with another 3D file',
      );
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const anaglyph = queryRunner.manager.create(Anaglyph, {
        title: data.title,
        section: {
          id: data.section_id,
        },
        model: model,
      });
      await queryRunner.manager.save(anaglyph);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        [data.anaglyph_file_attributes],
        anaglyph.id,
        'Anaglyph',
        'zip_file',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(anaglyph.id);

      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: UpdateRequestDTO) {
    const anaglyph = await this.anaglyphRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!anaglyph) {
      throw new NotFoundException(`Anaglyph with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (data.section_id && data.section_id !== anaglyph.section.id) {
        const sectionHasAnalyph = await this.anaglyphRepository.findOne({
          where: {
            section: {
              id: data.section_id,
            },
            is_deleted: false,
          },
        });
        if (sectionHasAnalyph) {
          throw new BadRequestException(
            'The given section is associated with another 3D file',
          );
        }
        Object.assign(anaglyph, {
          section: data.section_id,
        });
      }
      if (data.title) {
        Object.assign(anaglyph, {
          title: data.title,
        });
      }
      if (data.purchase_link) {
        Object.assign(anaglyph, {
          purchase_link: data.purchase_link,
        });
      }
      await queryRunner.manager.save(Anaglyph, anaglyph);
      if (data.anaglyph_file_attributes) {
        await this.commonStepService.saveAttachedMedia(
          queryRunner,
          [data.anaglyph_file_attributes],
          anaglyph.id,
          'Anaglyph',
          'zip_file',
        );
      }
      await queryRunner.commitTransaction();

      const response = await this.getById(anaglyph.id);

      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update_thumb_url(id: string, data: UpdateThumbUrlDTO) {
    const anaglyph = await this.anaglyphRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!anaglyph) {
      throw new NotFoundException(`Anaglyph with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (data.delete) {
        await this.dataSource.manager.delete(AttachedMedia, {
          file_type: 'thumb_url',
          mediable_id: anaglyph.id,
        });
      } else {
        await this.commonStepService.saveAttachedMedia(
          queryRunner,
          [
            {
              active_storage_attachment_id: data.active_storage_attachment_id,
            },
          ],
          anaglyph.id,
          'Anaglyph',
          'thumb_url',
        );
      }
      await queryRunner.commitTransaction();

      const response = await this.getById(anaglyph.id);

      return {
        anaglyph: response,
        message: 'Anaglyph Updated Successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async destroy(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const anaglyph = await queryRunner.manager.findOne(Anaglyph, {
        where: { id },
      });

      if (!anaglyph) {
        throw new NotFoundException(`Anaglyph with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Anaglyph,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.update(
        Part,
        {
          anaglyph: {
            id: id,
          },
        },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(AttachedMedia, {
        mediable_id: anaglyph.id,
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return {
        message: 'Deleted Successfully',
        anaglyph: {
          title: anaglyph.title,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async createPart(anaglyphId: string, data: AddEditPartRequestDTO) {
    const anaglyph = await this.anaglyphRepository.findOne({
      where: { id: anaglyphId },
    });

    // If the section is not found, throw an error
    if (!anaglyph) {
      throw new BadRequestException({
        error: `Anaglyph with ID ${anaglyph} not found`,
      });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const part = queryRunner.manager.create(Part, {
        ...data,
        anaglyph: anaglyph,
      });
      await queryRunner.manager.save(part);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        part.id,
        'Parts',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return part;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async updatePart(id: string, data: AddEditPartRequestDTO) {
    const part = await this.partRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!part) {
      throw new NotFoundException(`Part with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(part, {
        ...data,
      });
      await queryRunner.manager.save(Part, part);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        id,
        'Parts',
      );
      await queryRunner.commitTransaction();

      return {
        part,
        message: 'Updated Successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async destroyPart(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const part = await queryRunner.manager.findOne(Part, {
        where: { id },
      });

      if (!part) {
        throw new NotFoundException(`Part with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Part,
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

      return { message: 'Deleted Successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async clearAllParts(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const anaglyph = await queryRunner.manager.findOne(Anaglyph, {
        where: { id },
      });

      if (!anaglyph) {
        throw new NotFoundException(`Anaglyph with id ${id} not found`);
      }

      await queryRunner.manager.delete(Part, {
        anaglyph: {
          id: id,
        },
      });

      // await queryRunner.manager.delete(AttachedMedia, {
      //   mediable_id: id,
      // });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async getPartNote(modelId: string, partId: string, query: SearchParamsDTO) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }

      const queryBuilder = this.partNotesRepository
        .createQueryBuilder('note')
        .where('note.part_id = :part_id', { part_id: partId });

      if (query.search) {
        Note.search(queryBuilder, query.search);
      }

      const take = !query.limit ? undefined : 10; // Set your desired pagination limit
      const skip = (query.page - 1) * take;
      const [notes, total] = await queryBuilder
        .skip(skip)
        .take(take)
        .getManyAndCount(); // Adjust skip based on your pagination logic

      return {
        pagination: {
          current_page: query.page,
          offset: skip,
          per_page: take,
          total_entries: total,
        },
        notes: notes,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPartMedia(partId: string, query: SearchParamsDTO) {
    try {
      let queryBuilder = await this.attachedMediaRepository
        .createQueryBuilder('attached_medias')
        .leftJoinAndSelect(
          'attached_medias.active_storage_attachment_id',
          'active_storage_attachment_id',
        )
        .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
        .where('attached_medias.is_deleted = :isDeleted', { isDeleted: false })
        .andWhere('attached_medias.mediable_id = :partId', { partId });

      if (query.search) {
        const escapedKeyword = query.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        queryBuilder = queryBuilder.andWhere(
          "LOWER(blob.title) LIKE LOWER(:search) ESCAPE '\\'",
          { search: `%${escapedKeyword}%` },
        );
      }

      const take = 1000; // Set your desired pagination limit
      const skip = (query.page - 1) * take;
      const [attachments, total] = await queryBuilder
        .skip(skip)
        .take(take)
        .getManyAndCount(); // Adjust skip based on your pagination logic

      const medias = await Promise.all(
        attachments
          .filter((x) => x.active_storage_attachment_id)
          .map((attachment) =>
            this.mediaService.convertAttachementDTO(attachment),
          ),
      );

      return {
        pagination: {
          current_page: query.page,
          offset: skip,
          per_page: take,
          total_entries: total,
        },
        attached_medias: medias,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePartMedia(modelId: string, partId: string, mediaId: string) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }
      const note = await this.attachedMediaRepository.findOne({
        where: { id: mediaId },
      });
      if (!note) {
        throw new NotFoundException(`Media with ID ${mediaId} not found`);
      }
      await this.attachedMediaRepository.delete(mediaId);
      return {
        message: `Successfully deleted`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete media',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPartNoteById(modelId: string, partId: string, noteId: string) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }

      return {
        note: await this.getModelPartNoteById(noteId),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getModelPartNoteById(id: string) {
    return await this.partNotesRepository.findOne({
      where: { id: id },
    });
  }

  async createPartNote(
    modelId: string,
    partId: string,
    body: AddEditPartNoteRequestDTO,
  ) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }

      const note = this.partNotesRepository.create({
        part_id: partId,
        description: body.description,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await this.partNotesRepository.save(note);

      return {
        message: `Successfully added`,
        notes: await this.getModelPartNoteById(note.id),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePartNote(
    modelId: string,
    partId: string,
    noteId: string,
    body: AddEditPartNoteRequestDTO,
  ) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }

      const note = await this.partNotesRepository.findOne({
        where: { id: noteId },
      });
      if (!note) {
        throw new NotFoundException(`Note with ID ${noteId} not found`);
      }

      Object.assign(note, {
        ...body,
      });
      await this.partNotesRepository.save(note);

      return {
        message: `Successfully Updated`,
        notes: await this.getModelPartNoteById(note.id),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteNote(modelId: string, partId: string, noteId: string) {
    try {
      const model = await this.modelRepository.findOne({
        where: { model_id: modelId },
      });
      if (!model) {
        throw new NotFoundException(`Model with ID ${modelId} not found`);
      }
      const part = await this.partRepository.findOne({
        where: { id: partId },
      });
      if (!part) {
        throw new NotFoundException(
          `Part with ID ${partId} not found in the model ${modelId}`,
        );
      }
      const note = await this.partNotesRepository.findOne({
        where: { id: noteId },
      });
      if (!note) {
        throw new NotFoundException(`Note with ID ${noteId} not found`);
      }
      await this.partNotesRepository.delete(noteId);
      return {
        message: `Note with ID ${noteId} has been deleted successfully`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async startUploading(
    anaglyphId: string,
    filePath: string,
  ): Promise<{ message: string; status: number }> {
    try {
      const results = [];
      let stream;

      if (/^https?:\/\//.test(filePath)) {
        const response = await axios.get(filePath, { responseType: 'stream' });
        stream = response.data;
      } else {
        stream = fs.createReadStream(filePath);
      }

      return new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
              const anaglyph = await this.anaglyphRepository.findOne({
                where: { id: anaglyphId },
              });

              if (!anaglyph) {
                throw new BadRequestException({
                  error: `Anaglyph with ID ${anaglyphId} not found`,
                });
              }

              for (const record of results) {
                const existingPart = await queryRunner.manager.findOne(Part, {
                  where: {
                    layer_id: record['layer_id*'],
                    anaglyph: anaglyph,
                  },
                });

                if (existingPart) {
                  existingPart.part_name = record['part_name*'];
                  existingPart.part_id = record['part_id*'];
                  existingPart.part_description = record['part_description'];
                  existingPart.purchase_url = record['purchase_url'];
                  existingPart.nsn_number = record['nsn_number'];
                  existingPart.nomenclature = record['nomenclature'];
                  existingPart.manufacturer_code = record['mfr_code'];
                  existingPart.quantity = record['quantity']
                    ? Number(record['quantity'])
                    : 0;
                  existingPart.dynamic_fields = record['dynamic_fields'];
                  existingPart.part_fields = record['part_fields'];


                  await queryRunner.manager.save(existingPart);
                } else {
                  const part = queryRunner.manager.create(Part, {
                    part_name: record['part_name*'],
                    part_id: record['part_id*'],
                    layer_id: record['layer_id*'],
                    part_description: record['part_description'],
                    purchase_url: record['purchase_url'],
                    nsn_number: record['nsn_number'],
                    nomenclature: record['nomenclature'],
                    manufacturer_code: record['mfr_code'],
                    quantity: record['quantity']
                      ? Number(record['quantity'])
                      : 0,
                    anaglyph: anaglyph,
                    dynamic_fields: record['dynamic_fields'],
                    part_fields: record['part_fields'],
                  });

                  await queryRunner.manager.save(part);
                }
              }

              await queryRunner.commitTransaction();
            } catch (error) {
              await queryRunner.rollbackTransaction();
              throw error;
            } finally {
              await queryRunner.release();
            }
            resolve({ message: 'File uploaded successfully', status: 200 });
          })
          .on('error', (err) => reject(err));
      });
    } catch (error) {
      console.error('Error during CSV upload', error);
      return { message: 'Error processing the file', status: 500 };
    }
  }
}
