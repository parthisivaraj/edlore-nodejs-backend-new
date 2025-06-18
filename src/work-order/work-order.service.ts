//UUID BIGINT ERROR

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, QueryRunner, Repository } from 'typeorm';
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@app/schema/model/work-order.entity';
import { ModelResponseDto } from 'src/model/dto/model';
import { WorkOrderResponseDto, WorkOrderResponse, CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderTodosAttribute } from './dto/work-order';
import { JwtUserPayload, SearchParamsDTO } from '@app/schema/dto';
import { WorkOrderTodo, Model, WhichCategory} from '@app/schema';
import { Procedure } from '@app/schema/model/procedure.entity';
import { Troubleshoot } from '@app/schema/model/troubleshoot.entity';
import { ErrorCode } from '@app/schema/model/error-code.entity';

@Injectable()
export class WorkOrderService { 
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Procedure)
    private readonly procedureRepository: Repository<Procedure>,
    @InjectRepository(Troubleshoot)
    private readonly troubleshootRepository: Repository<Troubleshoot>,
    @InjectRepository(ErrorCode)
    private readonly errorCodeRepository: Repository<ErrorCode>,

    private dataSource: DataSource,
  ) {}

  async get(params: SearchParamsDTO): Promise<WorkOrderResponse> {
    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('work_order')
      .leftJoinAndSelect('work_order.device', 'device')
      .leftJoinAndSelect('device.model_id', 'model_id')
      .leftJoinAndSelect('model_id.category_id', 'category_id')
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
    // const workOrder = await this.workOrderRepository.findOne({
    //   where: {
    //     id: id,
    //     is_deleted: false,
    //   },
    //   relations: ['device', 'assigned_to'],
    // });
    const workOrder = await this.workOrderRepository.findOne({
      where: {
        id: id,
        is_deleted: false,
      },
      relations: [
        'device',
        'device.model_id',
        'device.model_id.category_id',
        'assigned_to',
      ],
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return this.toResponse(workOrder);
  }

  private convertToModelDTO(model: Model) {
      const response = new ModelResponseDto();
      response.id = model.id;
      response.model_id = model.model_id;
      response.title = model.title;
      response.which_category = WhichCategory[model.which_category];
      response.primary_category =
        model.which_category === WhichCategory.primary
          ? {
              id: model?.category_id?.id,
              name: model?.category_id?.name,
            }
          : null; // Adjust as needed
      response.secondary_category =
        model.which_category === WhichCategory.secondary
          ? {
              id: model?.category_id?.id,
              name: model?.category_id?.name,
              super_category: {
                id: model?.category_id?.parent_id?.id,
                name: model?.category_id?.parent_id?.name,
              },
            }
          : null; // Adjust as needed
      return response;
    }

  private toResponse(workOrder: WorkOrder): any {
    // return {
    //   id: workOrder.id,
    //   work_order_number: workOrder.work_order_number,
    //   title: workOrder.title,
    // }
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
              id: (workOrder.assigned_to.user_groups && workOrder.assigned_to.user_groups.length!=0) ? workOrder.assigned_to.user_groups[0]?.group.id:workOrder.assigned_to_id,
              title: (workOrder.assigned_to.user_groups && workOrder.assigned_to.user_groups.length!=0) ? workOrder.assigned_to.user_groups[0]?.group.title:workOrder.assigned_to_type,
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
            model: this.convertToModelDTO(workOrder.device.model_id),
            // model: workOrder.device.model_id
            //   ? {
            //       id: workOrder.device.model_id.id,
            //       model_id: workOrder.device.model_id.model_id,
            //       title: workOrder.device.model_id.title,
            //       which_category: WhichCategory[workOrder.device.model_id.which_category],
            //       primary_category: (WhichCategory[workOrder.device.model_id.which_category] == 'primary') ? workOrder.device.model_id.category_id : null,
            //       secondary_category: (WhichCategory[workOrder.device.model_id.which_category] == 'secondary') ? workOrder.device.model_id.category_id : null,
            //       // primary_category: workOrder.device.model_id.primary_category,
            //       // secondary_category: workOrder.device.model_id
            //       //   .secondary_category
            //       //   ? {
            //       //       id: workOrder.device.model_id.secondary_category.id,
            //       //       name: workOrder.device.model_id.secondary_category.name,
            //       //       super_category:
            //       //         workOrder.device.model_id.secondary_category
            //       //           .super_category,
            //       //     }
            //       //   : null,
            //     }
            //   : null,
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
      // work_order_status: workOrder.work_order_status,
      note: workOrder.note,
      // completed_task: workOrder.completed_task || null,
    };
  }

  async create(data: CreateWorkOrderDto, user: JwtUserPayload): Promise<any> {
  
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        const work_order = queryRunner.manager.create(WorkOrder, {
          title: data.title,
          device_id: data.device_id,
          work_order_number: data.work_order_number,
          status: data.status,
          priority: 1,
          created_user_id: user.id,
        });
        await queryRunner.manager.save(work_order);

        // Commit the transaction
        await queryRunner.commitTransaction();
  
        const workOrder = await this.workOrderRepository.findOne({
          where: {
            id: work_order.id,
          },
          relations: ['device', 'assigned_to'],
        });
    
        if (!workOrder) {
          throw new NotFoundException('Work order not found');
        }
        
        return {
          work_order: workOrder,
          message: 'Success'
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner when done
        await queryRunner.release();
      }
  }

  async resolveTaskable(taskable_type: string, taskable_id: string) {
    // taskable_id: Procedure | Troubleshoot | ErrorCode
    const repo = {
      'Procedure': this.procedureRepository,
      'Troubleshoot': this.troubleshootRepository,
      'ErrorCode': this.errorCodeRepository,
    }[taskable_type];
  
    return repo.findOneBy({ id: taskable_id });
  }

  private async saveWorkOrderTodos(
      queryRunner: QueryRunner,
      work_order_todos_attributes: WorkOrderTodosAttribute[],
      work_order_id: string,
    ) {
      for (const work_order_todo_obj of work_order_todos_attributes) {
          // Update or add new todo
          const taskableEntity = await this.resolveTaskable(work_order_todo_obj.taskable_type, work_order_todo_obj.taskable_id);
          const taskable_id = taskableEntity.id;
          const wo_to_do = queryRunner.manager.create(WorkOrderTodo, {
            work_order: { id: work_order_id },
            taskable_type: work_order_todo_obj.taskable_type,
            taskable_id: taskable_id, //work_order_todo_obj.taskable_id,
            created_at: new Date(),
            updated_at: new Date(),
          });
  
          await queryRunner.manager.save(WorkOrderTodo, wo_to_do);
      }
    }

  async update(id: string, data: UpdateWorkOrderDto) {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id, is_deleted: false },
      });
  
      if (!workOrder) {
        throw new NotFoundException(`Work Order with id ${id} not found`);
      }
  
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
  
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        Object.assign(workOrder, {
          repeat: data.repeat,
          status: data.status,
          task_type_id: data.task_type_id,
          assigned_to_id: data.assigned_to_id,
          assigned_to_type: data.assigned_to_type,
          note: data.note,
          priority: data.priority,
          role_id: data.role_id,
        });
        await queryRunner.manager.save(WorkOrder, workOrder);
  
        if ((data.work_order_todos_attributes || []).length > 0) {
          await this.saveWorkOrderTodos(
            queryRunner,
            data.work_order_todos_attributes,
            workOrder.id,
          );
        }
  
        await queryRunner.commitTransaction();
  
        return this.getById(workOrder.id);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner when done
        await queryRunner.release();
      }
    }
}