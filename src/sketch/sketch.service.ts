import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import { AttachedMedia, Model, Sketch, SketchType } from '@app/schema';
import {
  SectionSketchResponse,
  SectionSketchResponseDto,
  SketchDetaiDto,
  SketchDetailResponseDto,
  SketchResponse,
  SketchResponseDto,
  SketchSearchParams,
} from './dto/sketch';
import {
  CommonStepService,
  CustomUniqueService,
  FilterService,
} from '@app/schema/service';
import { MediaService } from 'src/media/media.service';
import { AddEditRequestDTO } from './dto/add-edit';

@Injectable()
export class SketchService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Sketch)
    private readonly sketchRepository: Repository<Sketch>,

    @InjectRepository(Model)
    private readonly modelRespository: Repository<Model>,

    private filterService: FilterService,
    @Inject()
    private mediaService: MediaService,
    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private convertToDTO(sketch: Sketch): SketchResponseDto {
    const response = new SketchResponseDto();
    response.id = sketch.id;
    response.title = sketch.title;
    response.sketch_type = SketchType[sketch.sketch_type];
    response.linked_medias = sketch.attached_medias.length;
    response.section_id = sketch.section?.id || null;
    response.section_title = sketch.section?.title || null;
    response.created_at = DateUtilsService.dateToString(sketch.created_at);
    return response;
  }

  private convertToSectionDTO(sketch: Sketch): SectionSketchResponseDto {
    const response = new SectionSketchResponseDto();
    response.id = sketch.id;
    response.title = sketch.title;
    response.sketch_type = SketchType[sketch.sketch_type];
    response.linked_medias = sketch.attached_medias.length;
    return response;
  }

  private async convertToDetailDTO(sketch: Sketch): Promise<SketchDetaiDto> {
    const response = new SketchResponseDto();
    response.id = sketch.id;
    response.title = sketch.title;
    response.sketch_type = SketchType[sketch.sketch_type];
    response.attached_medias = await Promise.all(
      sketch.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
    return response;
  }

  async get(
    modelId: string,
    type: number,
    params: SketchSearchParams,
  ): Promise<SketchResponse> {
    let queryBuilder = this.sketchRepository
      .createQueryBuilder('sketch')
      .leftJoinAndSelect('sketch.section', 'section')
      .leftJoinAndSelect('sketch.attached_medias', 'attached_medias')
      .where('sketch.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('sketch.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(sketch.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `sketch.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('sketch.updated_at', 'DESC');
    }

    if (type) {
      queryBuilder = queryBuilder.andWhere({
        sketch_type: type,
      });
    }

    const selected_filters = { sections: [] };

    if (params.filters) {
      const { sections } = params.filters;

      selected_filters.sections = sections || [];

      if (sections && sections.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'writtenIssue.section_id IN (:...sections)',
          {
            sections,
          },
        );
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [sketches, total] = await queryBuilder.getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'sections_only',
      modelId,
    );

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      sketches: sketches.map((sketch) => this.convertToDTO(sketch)),
      filters,
    };
  }

  async getBySection(
    modelId: string,
    sectionId: string,
    type: number,
    params: SketchSearchParams,
  ): Promise<SectionSketchResponse> {
    let queryBuilder = this.sketchRepository
      .createQueryBuilder('sketch')
      .leftJoinAndSelect('sketch.section', 'section')
      .leftJoinAndSelect('sketch.attached_medias', 'attached_medias')
      .where('sketch.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('sketch.section_id = :sectionId', { sectionId })
      .andWhere('sketch.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(sketch.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (type) {
      queryBuilder = queryBuilder.andWhere({
        sketch_type: type,
      });
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [sketches, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      sketches: sketches.map((sketch) => this.convertToSectionDTO(sketch)),
    };
  }

  async getById(
    sectionId: string,
    id: string,
  ): Promise<SketchDetailResponseDto> {
    const sketch = await this.sketchRepository
      .createQueryBuilder('sketch')
      .leftJoinAndSelect('sketch.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('sketch.id = :id', { id })
      .andWhere('sketch.section_id = :sectionId', { sectionId })
      .getOne();

    if (!sketch) {
      throw new NotFoundException('Sketch not found');
    }

    return {
      message: 'Success',
      sketch: await this.convertToDetailDTO(sketch),
    };
  }

  async create(modelId: string, secondaryId: string, data: AddEditRequestDTO) {
    const model = await this.modelRespository.findOne({
      where: { id: modelId },
    });

    // If the section is not found, throw an error
    if (!model) {
      throw new BadRequestException({
        error: `Model with ID ${model} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Sketch,
      'title',
      data.title,
      {
        sketch_type: data.sketch_type,
        model_id: modelId,
      },
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sketch = queryRunner.manager.create(Sketch, {
        title: data.title,
        section: secondaryId as any,
        model_id: modelId,
        sketch_type: data.sketch_type,
      });
      await queryRunner.manager.save(sketch);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        sketch.id,
        'Sketch',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return sketch;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, secondaryId: string, data: AddEditRequestDTO) {
    const sketch = await this.sketchRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!sketch) {
      throw new NotFoundException(`Sketch with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(sketch, {
        title: data.title,
        section_id: data.new_section_id || secondaryId,
      });
      await queryRunner.manager.save(Sketch, sketch);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        id,
        'WrittenIssue',
      );
      await queryRunner.commitTransaction();

      return {
        sketch: sketch,
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

  async destroy(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sketch = await queryRunner.manager.findOne(Sketch, {
        where: { id },
      });

      if (!sketch) {
        throw new NotFoundException(`Sketch with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Sketch,
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
}
