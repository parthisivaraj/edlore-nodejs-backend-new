import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActiveStorageAttachment,
  Device,
  DeviceStatus,
  Model,
  WhichCategory,
} from '@app/schema';
import { Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import * as QRCode from 'qrcode';

import {
  ChangeStatusDeviceDto,
  CreateDeviceDto,
  DeviceDetailsResponseDTO,
  DeviceResponse,
  DeviceResponseDto,
  UpdateDeviceDto,
} from './dto/devices';
import { DeviceSearchParams } from './dto/seach';
import { FilterService } from '@app/schema/service';
import { MediaService } from 'src/media/media.service';
import { ModelResponseDto } from 'src/model/dto/model';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    @InjectRepository(ActiveStorageAttachment)
    private readonly attachmentRepository: Repository<ActiveStorageAttachment>,

    private filterService: FilterService,
    private mediaService: MediaService,
  ) {}

  async get(params: DeviceSearchParams): Promise<DeviceResponse> {
    let queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.model_id', 'model')
      .leftJoinAndSelect('model.category_id', 'category')
      .leftJoinAndSelect('device.workOrders', 'workOrders')
      .leftJoinAndSelect('device.attachedMedia', 'active_storage_attachment_id')
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob') // Fetch blob for media
      .where({ is_deleted: false });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "(LOWER(device.name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(device.device_id) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapedKeyword}%` },
      );
    }

    const selected_filters = { models: [] };

    if (params.filters) {
      const { models } = params.filters;

      selected_filters.models = models || [];

      if (models && models.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'device.model_id IN (:...models)',
          {
            models,
          },
        );
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
      devices.map((device) => this.convertDeviceDTO(device)),
    );

    return {
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      devices: newDevices,
      filters,
    };
  }

  private async convertDeviceDTO(device: Device): Promise<DeviceResponseDto> {
    let image = this.mediaService.getDefaultDeviceImage();
    if (device.attachedMedia && device.attachedMedia.length > 0) {
      image = await this.mediaService.getThumbnailUrl(
        'image',
        device.attachedMedia[0].blob,
      );
    }

    return {
      id: device.id,
      name: device.name || 'Unnamed Device',
      status: DeviceStatus[device.status],
      procedure_count: device.workOrders ? device.workOrders.length : 0,
      category: device.model_id?.category_id?.name || null,
      model_name: device.model_id?.title || null,
      device_id: device.device_id,
      image_url: image,
      created_at: DateUtilsService.dateToString(device.created_at),
    };
  }

  private convertToModelDTO(model: Model) {
    const response = new ModelResponseDto();
    response.model_id = model.model_id;
    response.title = model.title;
    response.id = model.id;
    response.linked_devices = (model.devices || []).length;
    response.which_category = WhichCategory[model.which_category];
    response.primary_category =
      model.which_category === WhichCategory.primary
        ? {
            id: model.category_id.id,
            name: model.category_id.name,
          }
        : null; // Adjust as needed
    response.secondary_category =
      model.which_category === WhichCategory.secondary
        ? {
            id: model.category_id.id,
            name: model.category_id.name,
            super_category: {
              id: model.category_id.parent_id.id,
              name: model.category_id.parent_id.name,
            },
          }
        : null; // Adjust as needed
    response.created_at = DateUtilsService.dateToString(model.created_at); // Adjust formatting as necessary
    return response;
  }

  async getById(id: string): Promise<DeviceDetailsResponseDTO> {
    const device = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.model_id', 'model')
      .leftJoinAndSelect('model.category_id', 'category')
      .leftJoin('category.parent_id', 'superCategory')
      .addSelect(['superCategory.id', 'superCategory.name'])
      .leftJoinAndSelect('device.attachedMedia', 'active_storage_attachment_id')
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .where('device.id = :id', { id })
      .getOne();

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    let imageUrl = this.mediaService.getDefaultDeviceImage();
    if (device.attachedMedia && device.attachedMedia.length > 0) {
      imageUrl = await this.mediaService.getThumbnailUrl(
        'image',
        device.attachedMedia[0].blob,
      );
    }

    const qrCodeValue = { id: device.id, name: device.name, type: 'device' };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeValue), {
      width: 600,
      margin: 2,
    });
    return {
      id: device.id,
      name: device.name || 'Unnamed Device',
      status: DeviceStatus[device.status],
      category: device.model_id?.category_id?.name || null,
      device_id: device.device_id,
      depth: device.depth,
      generated_qr: qrCode,
      image: imageUrl,
      length: device.length,
      location: device.device_location,
      manufactured_by: device.manufactured_by,
      manufactured_date: device.manufactured_date
        ? DateUtilsService.dateToString(new Date(device.manufactured_date))
        : null,

      warranty_till: device.warranty_till
        ? DateUtilsService.dateToString(new Date(device.warranty_till))
        : null,

      last_repair_date: device.last_repair_date
        ? DateUtilsService.dateToString(new Date(device.last_repair_date))
        : null,
      message: 'Success',
      model: this.convertToModelDTO(device.model_id),
      serial_number: device.serial_number,
      width: device.width,
    };
  }

  async create(data: CreateDeviceDto) {
    const device = this.deviceRepository.create(data);
    return await this.deviceRepository.save(device);
  }

  async update(id: string, data: UpdateDeviceDto, image: Express.Multer.File) {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['attachedMedia'], // Make sure the relation is loaded
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    const { generate_qr, ...filteredData } = data;

    const deviceName = data.name || device.name;
    if (image) {
      await this.attachmentRepository.remove(device.attachedMedia);
      const attached_media = await this.mediaService.saveMedia(image, {
        media_title: deviceName,
        media_type: 'image',
        name: 'image',
        record_id: device.id,
        record_type: 'Device',
      });
    }

    await this.deviceRepository.update(id, filteredData);
    return this.getById(id);
  }

  async changeStatus(id: string, data: ChangeStatusDeviceDto) {
    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    await this.deviceRepository.update(id, data);
    return {
      message: 'Successfully Updated Status',
      status: data.status,
      name: device.name,
    };
  }

  async remove(id: string) {
    const result = await this.deviceRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return result;
  }
}
