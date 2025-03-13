//UUID BIGINT ERROR

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@app/schema/model/work-order.entity';
import { WorkOrderResponseDto, WorkOrderResponse } from './dto/work-order';
import { SearchParamsDTO } from '@app/schema/dto';

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
  ) {}

  async get(params: SearchParamsDTO): Promise<WorkOrderResponse> {
    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('work_order')
      .leftJoinAndSelect('work_order.device', 'device')
      .leftJoinAndSelect('work_order.assigned_to', 'assigned_to')
      .where('work_order.is_deleted = :isDeleted', { isDeleted: false });

    // if (params.id) {
    //   queryBuilder.andWhere('work_order.id = :id', { id: params.id });
    // }

    // if (params.active) {
    //   queryBuilder.andWhere('work_order.status = :status', {
    //     status: WorkOrderStatus.active,
    //   });
    // }

    // if (params.draft) {
    //   queryBuilder.andWhere('work_order.status = :status', {
    //     status: WorkOrderStatus.draft,
    //   });
    // }

    // if (params.completed) {
    //   queryBuilder.andWhere('work_order.status = :status', {
    //     status: WorkOrderStatus.completed,
    //   });
    // }

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder.andWhere(
        "LOWER(work_order.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder.skip(skip).take(take);

    const [workOrders, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      work_orders: workOrders.map((order) => this.toResponse(order)),
      message: 'Success',
    };
  }

  async getById(id: string): Promise<WorkOrderResponseDto> {
    const workOrder = await this.workOrderRepository.findOne({
      where: {
        id: id,
        is_deleted: false,
      },
      relations: ['device', 'assigned_to'],
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return this.toResponse(workOrder);
  }

  private toResponse(workOrder: WorkOrder): WorkOrderResponseDto {
    return {
      id: workOrder.id,
      work_order_number: workOrder.work_order_number,
      title: workOrder.title,
      repeat: workOrder.repeat || false,
      status: WorkOrderStatus[workOrder.status],
      priority: WorkOrderPriority[workOrder.priority],
      assigned_to_type: workOrder.assigned_to_type,
      assigned_to: workOrder.assigned_to
        ? {
            group: {
              id: workOrder.assigned_to.user_groups[0].group.id,
              title: workOrder.assigned_to.user_groups[0].group.title,
            },
          }
        : null,
      device: workOrder.device
        ? ({
            id: workOrder.device.id,
            name: workOrder.device.name,
            device_id: workOrder.device.device_id,
            serial_number: workOrder.device.serial_number,
            status: workOrder.device.status,
            created_at: workOrder.device.created_at.toISOString(),
            model: workOrder.device.model_id
              ? {
                  id: workOrder.device.model_id.id,
                  model_id: workOrder.device.model_id.model_id,
                  title: workOrder.device.model_id.title,
                  which_category: workOrder.device.model_id.which_category,
                  // primary_category: workOrder.device.model_id.primary_category,
                  // secondary_category: workOrder.device.model_id
                  //   .secondary_category
                  //   ? {
                  //       id: workOrder.device.model_id.secondary_category.id,
                  //       name: workOrder.device.model_id.secondary_category.name,
                  //       super_category:
                  //         workOrder.device.model_id.secondary_category
                  //           .super_category,
                  //     }
                  //   : null,
                }
              : null,
          } as any)
        : null,
      created_at: workOrder.created_at.toISOString(),
      created_at_formated: workOrder.created_at.toISOString(),
      task_type: workOrder.task_type
        ? {
            id: workOrder.task_type.id,
            title: workOrder.task_type.title,
            is_deleted: workOrder.task_type.is_deleted,
            work_orders: workOrder.task_type.work_orders,
            workOrders: workOrder.task_type.workOrders,
            updateTimestamp: workOrder.task_type.updateTimestamp,
            created_at: workOrder.task_type.created_at,
            updated_at: workOrder.task_type.updated_at,
            beforeUpdate: workOrder.task_type.beforeUpdate,
            beforeInsert: workOrder.task_type.beforeInsert,
          }
        : null,
      work_order_status: workOrder.work_order_status,
      note: workOrder.note,
      completed_task: workOrder.completed_task || null,
    };
  }
}
