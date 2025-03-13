import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  HttpException, 
  HttpStatus
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { AttachedMedia, Model, SafetyMeasure } from '@app/schema';
import {
  SafetyMeasureDetailResponseDto,
  SafetyMeasureDetailsResponseDto,
  SafetyMeasureFilters,
  SafetyMeasureResponse,
  SafetyMeasureResponseDto,
  SafetyMeasureSearchParams,
} from './dto/safety-measure';
import { DateUtilsService } from '@app/common-utils';
import {
  CommonStepService,
  CustomUniqueService,
  FilterService,
} from '@app/schema/service';
import { MediaService } from 'src/media/media.service';
import { AddEditRequestDTO } from './dto/add-edit';

@Injectable()
export class SafetyMeasureService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(SafetyMeasure)
    private readonly safetyMeasureRepository: Repository<SafetyMeasure>,

    @InjectRepository(Model)
    private readonly modelRespository: Repository<Model>,

    @Inject()
    private mediaService: MediaService,

    private filterService: FilterService,
    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private convertToDTO(safetyMeasure: SafetyMeasure): SafetyMeasureResponseDto {
    const response = new SafetyMeasureResponseDto();
    response.id = safetyMeasure.id;
    response.title = safetyMeasure.title;
    response.created_at = DateUtilsService.dateToString(
      safetyMeasure.created_at,
    );
    response.last_updated = DateUtilsService.dateToString(
      safetyMeasure.updated_at,
    );
    response.media_count = safetyMeasure.attached_medias.length;
    return response;
  }

  private async convertToDetailDTO(
    safetyMeasure: SafetyMeasure,
  ): Promise<SafetyMeasureDetailsResponseDto> {
    const response = new SafetyMeasureDetailsResponseDto();
    response.id = safetyMeasure.id;
    response.title = safetyMeasure.title;
    response.enabled = safetyMeasure.enabled ? 'enabled' : 'disabled';
    response.description = safetyMeasure.description;
    response.title = safetyMeasure.title;
    response.created_at = DateUtilsService.dateToString(
      safetyMeasure.created_at,
    );
    response.last_updated = DateUtilsService.dateToString(
      safetyMeasure.updated_at,
    );
    response.media_count = safetyMeasure.attached_medias.length;
    response.attached_medias = await Promise.all(
      safetyMeasure.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
    return response;
  }

  async get(
    modelId: string,
    params: SafetyMeasureSearchParams,
  ): Promise<SafetyMeasureResponse> {
    let queryBuilder = this.safetyMeasureRepository
      .createQueryBuilder('safety_measure')
      .leftJoinAndSelect('safety_measure.attached_medias', 'attached_medias')
      .where('safety_measure.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('safety_measure.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(safety_measure.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `safety_measure.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('safety_measure.updated_at', 'DESC');
    }
    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);

    const selected_filters: SafetyMeasureFilters = {
      status: [],
    };

    if (params.filters) {
      const { status } = params.filters;

      selected_filters.status = status || [];

      if (status && status.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'safety_measure.enabled IN (:...status)',
          {
            status,
          },
        );
      }
    }

    const [safetyMeasures, total] = await queryBuilder.getManyAndCount();

    const filters = (await this.filterService.getFilters(
      selected_filters,
      'safety_measures',
    )) as SafetyMeasureFilters;

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      safety_measures: safetyMeasures.map((measure) =>
        this.convertToDTO(measure),
      ),
      filters,
      message: 'Success',
    };
  }

  async enabled_safety_measures(
    modelId: string,
    params: SafetyMeasureSearchParams,
  ): Promise<SafetyMeasureResponse> {
    let queryBuilder = this.safetyMeasureRepository
      .createQueryBuilder('safety_measure')
      .leftJoinAndSelect('safety_measure.attached_medias', 'attached_medias')
      .where('safety_measure.is_deleted = :isDeleted', { isDeleted: false })
      .where('safety_measure.enabled = :enabled', { enabled: 1 })
      .andWhere('safety_measure.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(safety_measure.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }
    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);

    const selected_filters: SafetyMeasureFilters = {
      status: [],
    };

    if (params.filters) {
      const { status } = params.filters;

      selected_filters.status = status || [];

      if (status && status.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'safety_measure.enabled IN (:...status)',
          {
            status,
          },
        );
      }
    }

    const [safetyMeasures, total] = await queryBuilder.getManyAndCount();

    const filters = (await this.filterService.getFilters(
      selected_filters,
      'safety_measures',
    )) as SafetyMeasureFilters;

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      safety_measures: safetyMeasures.map((measure) =>
        this.convertToDTO(measure),
      ),
      filters,
      message: 'Success',
    };
  }

  async getById(id: string): Promise<SafetyMeasureDetailResponseDto> {
    const safetyMeasure = await this.safetyMeasureRepository
      .createQueryBuilder('safety_measures')
      .leftJoinAndSelect('safety_measures.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('safety_measures.id = :id', { id })
      .getOne();

    if (!safetyMeasure) {
      throw new NotFoundException('Safety Measure not found');
    }

    return {
      message: 'Success',
      safety_measure: await this.convertToDetailDTO(safetyMeasure),
    };
  }

  async create(modelId: string, data: AddEditRequestDTO) {
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
      SafetyMeasure,
      'title',
      data.title,
      {
        model_id: modelId,
      },
    );
    if (duplicateTitle) {
      throw new HttpException({ errors: [{name: 'title', message: 'Title should be unique'}] }, HttpStatus.NOT_ACCEPTABLE);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const safetyMeasure = queryRunner.manager.create(SafetyMeasure, {
        title: data.title,
        description: data.description,
        model_id: model,
      });
      await queryRunner.manager.save(safetyMeasure);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        safetyMeasure.id,
        'SafetyMeasure',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(safetyMeasure.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: AddEditRequestDTO) {
    const safetyMeasure = await this.safetyMeasureRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!safetyMeasure) {
      throw new NotFoundException(`Safety Measure with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(safetyMeasure, {
        title: data.title,
        description: data.description,
      });
      await queryRunner.manager.save(SafetyMeasure, safetyMeasure);

      await this.commonStepService.saveAttachedMedia(
        queryRunner,
        data.attached_medias_attributes,
        id,
        'SafetyMeasure',
      );
      await queryRunner.commitTransaction();

      const response = await this.getById(safetyMeasure.id);
      return {
        safety_measure: response,
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
      const safetyMeasure = await queryRunner.manager.findOne(SafetyMeasure, {
        where: { id },
      });

      if (!safetyMeasure) {
        throw new NotFoundException(`Safery Measure with id ${id} not found`);
      }

      await queryRunner.manager.update(
        SafetyMeasure,
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
