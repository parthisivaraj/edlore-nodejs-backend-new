import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
  Category,
  Device,
  DeviceStatus,
  Model,
  Procedure,
  Section,
  WhichCategory,
} from '@app/schema';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { SearchParamsDTO } from '@app/schema/dto';
import {
  ModelDetailsResponseDto,
  ModelResponse,
  ModelResponseDto,
} from './dto/model';
import { DateUtilsService } from '@app/common-utils';
import { AddModelDTORequest, EditModelDTORequest } from './dto/add-edit';
import { DeviceSearchParams } from 'src/devices/dto/seach';
import { DeviceResponse } from 'src/devices/dto/devices';
import { CustomUniqueService, FilterService } from '@app/schema/service';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class ModelService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    @Inject()
    private mediaService: MediaService,

    private filterService: FilterService,

    private customUniqueService: CustomUniqueService,
  ) {}

  private convertToDTO(model: Model) {
    const response = new ModelResponseDto();
    response.model_id = model.model_id;
    response.title = model.title;
    response.id = model.id;
    response.linked_devices = model.devices.length;
    response.which_category = WhichCategory[model.which_category];
    response.primary_category =
      model.which_category === WhichCategory.primary ? model.category_id : null; // Adjust as needed
    response.secondary_category =
      model.which_category === WhichCategory.secondary
        ? model.category_id
        : null; // Adjust as needed
    response.created_at = DateUtilsService.dateToString(model.created_at); // Adjust formatting as necessary
    return response;
  }

  private convertToDetailsDTO(model: Model) {
    const response = new ModelDetailsResponseDto();
    response.model_id = model.model_id;
    response.title = model.title;
    response.id = model.id;
    response.linked_devices = model.devices.filter((x) => !x.is_deleted).length;
    response.procedures_count = model.procedures.filter(
      (x) => !x.is_deleted,
    ).length;
    response.primary_category =
      model.which_category === WhichCategory.primary ? model.category_id : null; // Adjust as needed
    response.secondary_category =
      model.which_category === WhichCategory.secondary
        ? ({
            ...model.category_id,
            super_category: model.category_id.parent_id,
            parent_id: undefined,
          } as any)
        : null; // Adjust as needed
    return response;
  }

  private async getModelDetails(id: string) {
    const queryBuilder = this.modelRepository
      .createQueryBuilder('model')
      .leftJoin('model.category_id', 'category')
      .addSelect(['category.id', 'category.name'])
      .leftJoin('category.parent_id', 'superCategory')
      .addSelect(['superCategory.id', 'superCategory.name'])
      .leftJoinAndSelect(
        'model.devices',
        'devices',
        'devices.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect('devices.attachedMedia', 'attachedMedia')
      .leftJoinAndSelect('model.procedures', 'procedures')
      .where({ id });

    const model = await queryBuilder.getOne();
    return model;
  }

  async get(params: SearchParamsDTO): Promise<ModelResponse> {
    let queryBuilder = this.modelRepository
      .createQueryBuilder('model')
      .leftJoin('model.category_id', 'category')
      .addSelect(['category.id', 'category.name'])
      .leftJoinAndSelect(
        'model.devices',
        'devices',
        'devices.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .where({ is_deleted: false });

    // Handle sorting
    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `model.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('model.updated_at', 'DESC');
    }

    // Handle searching
    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "(LOWER(model.title) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(model.model_id) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(category.name) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapedKeyword}%` },
      );
    }

    // Handle pagination
    const take = !params.limit ? undefined : 10; // Set your desired pagination limit
    const skip = (params.page - 1) * take;
    const [models, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount(); // Adjust skip based on your pagination logic

    return {
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      models: models.map((model) => this.convertToDTO(model)),
    };
  }

  async getById(id: string) {
    const model = await this.getModelDetails(id);

    const newDevices = await Promise.all(
      model.devices.map((device) => this.convertDeviceDTO(device)),
    );
    return {
      ...this.convertToDetailsDTO(model),
      devices: newDevices,
      message: 'Success',
    };
  }

  private async convertDeviceDTO(device: Device) {
    let image = this.mediaService.getDefaultDeviceImage();
    if (
      (device.attachedMedia || []).length > 0 &&
      device.attachedMedia[0].blob
    ) {
      image = await this.mediaService.getThumbnailUrl(
        'image',
        device.attachedMedia[0].blob,
      );
    }
    return {
      id: device.id,
      name: device.name,
      image: image,
      device_id: device.device_id,
      serial_number: device.serial_number,
      status: DeviceStatus[device.status],
      created_at: DateUtilsService.dateToString(device.created_at),
      model: device.model_id,
    };
  }

  async getByDevice(
    model_id: string,
    params: DeviceSearchParams,
  ): Promise<DeviceResponse> {
    let queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.model_id', 'model')
      .leftJoinAndSelect('model.category_id', 'category')
      .leftJoinAndSelect('device.attachedMedia', 'active_storage_attachment_id')
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where({
        is_deleted: false,
        model_id,
      });

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `device.${params.sort_column}`,
        (params.sort_order as any).toUpperCase(),
      );
    } else {
      queryBuilder = queryBuilder.orderBy('device.updated_at', 'DESC');
    }

    if (params.search) {
      queryBuilder = queryBuilder.andWhere('device.name ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const selected_filters = { models: [], status: [] };

    if (params.filters) {
      const { models, status } = params.filters;

      selected_filters.models = models || [];
      selected_filters.status = status || [];

      if (models && models.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'device.model_id IN (:...models)',
          {
            models,
          },
        );
      }

      // Apply status filters
      if (status && status.length > 0) {
        queryBuilder = queryBuilder.andWhere('device.status IN (:...status)', {
          status,
        });
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    const [devices, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'all_devices',
    );

    const newDevices = await Promise.all(
      devices.map((step) => this.convertDeviceDTO(step)),
    );

    return {
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      filters,
      devices: newDevices,
    };
  }

  async create(data: AddModelDTORequest) {
    const category = await this.categoryRepository.findOne({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new BadRequestException({
        error: `Category with ID ${data.category_id} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Model,
      'title',
      data.title,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const duplicateModel = await this.customUniqueService.isExist(
      Model,
      'model_id',
      data.model_id,
    );
    if (duplicateModel) {
      throw new BadRequestException({ error: 'ModelId should be unique' });
    }

    const model = this.modelRepository.create({
      ...data,
      category_id: category,
    });

    const result = await this.modelRepository.save(model);
    return result;
  }

  async update(id: string, data: EditModelDTORequest) {
    const category = await this.categoryRepository.findOne({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new BadRequestException({
        error: `Category with ID ${data.category_id} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Model,
      'title',
      data.title,
      {},
      id,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const duplicateModel = await this.customUniqueService.isExist(
      Model,
      'model_id',
      data.model_id,
      {},
      id,
    );
    if (duplicateModel) {
      throw new BadRequestException({ error: 'ModelId should be unique' });
    }

    await this.modelRepository.update(id, {
      ...data,
      category_id: category,
    });
    return {
      message: 'Model updated successfully',
      model: data,
    };
  }

  async remove(id: string) {
    const modal = await this.modelRepository.findOne({ where: { id } });

    if (!modal) {
      throw new BadRequestException({
        error: `Model with ID ${id} not found`,
      });
    }
    // Get a query runner to manage the transaction
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    // Start the transaction
    await queryRunner.startTransaction();

    try {
      // Soft delete the category
      await queryRunner.manager.update(Model, id, { is_deleted: true });

      // Cascade soft delete to related devices
      await queryRunner.manager.update(
        Device,
        { model_id: id },
        { is_deleted: true },
      );

      // Cascade soft delete to related procedures
      await queryRunner.manager.update(
        Procedure,
        { model_id: id },
        { is_deleted: true },
      );

      // Cascade soft delete to related sections
      await queryRunner.manager.update(
        Section,
        { model_id: id },
        { is_deleted: true },
      );

      // Commit the transaction if all operations succeed
      await queryRunner.commitTransaction();

      return modal;
    } catch (err) {
      // Rollback the transaction in case of failure
      await queryRunner.rollbackTransaction();
      throw err; // Rethrow the error after rollback
    } finally {
      // Release the query runner after transaction is complete
      await queryRunner.release();
    }
  }
}
