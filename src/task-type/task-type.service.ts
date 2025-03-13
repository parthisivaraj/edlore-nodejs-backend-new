import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import { TaskType } from '@app/schema/model/task-type.entity';
import {
  TaskTypeResponseDto,
  TaskTypeApiResponseDto,
  FiltersResponse,
  FilterItem,
} from './dto/task-type';
import { PaginationResponse } from '@app/schema/dto';
import { SearchParamsDTO } from '@app/schema/dto';

@Injectable()
export class TaskTypeService {
  constructor(
    @InjectRepository(TaskType)
    private readonly taskTypeRepository: Repository<TaskType>,
  ) {}

  private convertToDTO(taskType: TaskType): TaskTypeResponseDto {
    const response = new TaskTypeResponseDto();
    response.id = taskType.id;
    response.title = taskType.title;
    response.created_at = DateUtilsService.dateToString(taskType.created_at);
    response.updated_at = DateUtilsService.formatDate(taskType.updated_at);
    response.active_work_orders = taskType.workOrders
      ? taskType.workOrders.length
      : 0;
    response.status = taskType.is_deleted ? 'inactive' : 'active';

    return response;
  }

  async get(params: SearchParamsDTO): Promise<TaskTypeApiResponseDto> {
    let queryBuilder = this.taskTypeRepository
      .createQueryBuilder('task_type')
      .where('task_type.is_deleted = :isDeleted', { isDeleted: false });

    const page = params.page || 1;
    const limit = params.limit || 10;

    const skip = (page - 1) * limit;

    const [taskTypes, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const taskTypeDTOs = taskTypes.map((taskType) =>
      this.convertToDTO(taskType),
    );

    const paginationResponse: PaginationResponse = {
      total_entries: total,
      current_page: page,
      per_page: limit,
      offset: skip,
    };

    const filtersResponse: FiltersResponse = {
      applicable_filters: [
        {
          name: 'Status',
          param: 'status',
          items: [
            { id: 1, title: 'Active' },
            { id: 2, title: 'Inactive' },
          ],
        },
      ],
      selected_filters: {
        status: [],
      },
    };

    return {
      task_types: taskTypeDTOs,
      pagination: paginationResponse,
      filters: filtersResponse,
      message: 'Success',
    };
  }

  async getById(id: string): Promise<TaskTypeResponseDto> {
    const taskType = await this.taskTypeRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!taskType) {
      throw new NotFoundException('Task Type not found');
    }

    return this.convertToDTO(taskType);
  }
}
