import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import {
  Troubleshoot,
  ApprovalStatus,
  TroubleshootStep,
  Model,
  AttachedMedia,
} from '@app/schema';
import {
  AddEditTroubleshootDto,
  ApprovalStatusTroubleshootDto,
  TroubleshootDetailResponseDto,
  TroubleshootResponse,
  TroubleshootResponseDto,
} from './dto/troubleshoot';
import { AttachedMediaDTO, SearchParamsDTO } from '@app/schema/dto';
import { MediaService } from 'src/media/media.service';
import { CommonStepService, CustomUniqueService } from '@app/schema/service';

@Injectable()
export class TroubleshootService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Troubleshoot)
    private readonly troubleshootRepository: Repository<Troubleshoot>,

    @InjectRepository(TroubleshootStep)
    private readonly troubleshootStepRepository: Repository<TroubleshootStep>,

    @InjectRepository(Model)
    private readonly modelRespository: Repository<Model>,

    private mediaService: MediaService,
    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private convertToDTO(troubleshoot: Troubleshoot): TroubleshootResponseDto {
    return {
      id: troubleshoot.id,
      title: troubleshoot.title,
      model_id: troubleshoot.model_id ? troubleshoot.model_id.id : null,
      created_at: DateUtilsService.dateToString(troubleshoot.created_at),
      steps_count: (troubleshoot.troubleshootSteps || []).length,
      steps_approval: (troubleshoot.troubleshootSteps || []).every(
        (x) => x.approvalStatus === ApprovalStatus.approved,
      )
        ? ApprovalStatus[ApprovalStatus.approved]
        : ApprovalStatus[ApprovalStatus.waiting],
      troubleshoot_steps: (troubleshoot.troubleshootSteps || []).map(
        (step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          step_order: step.step_order,
          approval_status: ApprovalStatus[step.approvalStatus],
          created_at: DateUtilsService.dateToString(step.created_at),
          medias: [],
          user_id: '', // user_id : step.user_id, TODO: Add user_id to TroubleshootStep entity
        }),
      ),
    };
  }

  private async mediaDTO(
    troubleshootStep: TroubleshootStep,
  ): Promise<AttachedMediaDTO[]> {
    return await Promise.all(
      troubleshootStep.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
  }

  private async convertToDetailDTO(
    troubleshoot: Troubleshoot,
  ): Promise<TroubleshootResponseDto> {
    const response = {
      id: troubleshoot.id,
      title: troubleshoot.title,
      model_id: troubleshoot.model_id ? troubleshoot.model_id.id : null,
      created_at: DateUtilsService.dateToString(troubleshoot.created_at),
      steps_count: (troubleshoot.troubleshootSteps || []).length,
      steps_approval: (troubleshoot.troubleshootSteps || []).every(
        (x) => x.approvalStatus === ApprovalStatus.approved,
      )
        ? ApprovalStatus[ApprovalStatus.approved]
        : ApprovalStatus[ApprovalStatus.waiting],
      troubleshoot_steps: [],
    };
    response.troubleshoot_steps = await Promise.all(
      (troubleshoot.troubleshootSteps || []).map(async (step) => {
        return {
          id: step.id,
          title: step.title,
          description: step.description,
          step_order: step.step_order,
          approval_status: ApprovalStatus[step.approvalStatus],
          created_at: DateUtilsService.dateToString(step.created_at),
          medias: await this.mediaDTO(step),
          user_id: '', // user_id : step.user_id, TODO: Add user_id to TroubleshootStep entity
        };
      }),
    );

    return response;
  }

  async get(
    modelId: string,
    params: SearchParamsDTO,
  ): Promise<TroubleshootResponse> {
    let queryBuilder = this.troubleshootRepository
      .createQueryBuilder('troubleshoot')
      .leftJoinAndSelect('troubleshoot.model_id', 'model')
      .leftJoinAndSelect(
        'troubleshoot.troubleshootSteps',
        'steps',
        'steps.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .where('troubleshoot.is_deleted = :is_deleted', { is_deleted: false })
      .andWhere('troubleshoot.model_id = :modelId', { modelId });

    // Handle searching
    if (params.search) {
      const escapedKeyword = params.search.replace(/[%_]/g, '\\$&');
      queryBuilder = queryBuilder.andWhere('troubleshoot.title ILIKE :search', {
        search: `%${escapedKeyword}%`,
      });
    }

    // Handle sorting
    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `troubleshoot.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('troubleshoot.created_at', 'DESC');
    }

    const take = !params.limit ? undefined : 10;
    const skip = (params.page - 1) * take;

    const [troubleshoots, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return {
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      troubleshoots: troubleshoots.map((troubleshoot) =>
        this.convertToDTO(troubleshoot),
      ),
      message: 'Success',
    };
  }

  async getById(id: string): Promise<TroubleshootDetailResponseDto> {
    const troubleshoot = await this.troubleshootRepository
      .createQueryBuilder('troubleshoot')
      .leftJoinAndSelect(
        'troubleshoot.troubleshootSteps',
        'steps',
        'steps.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect('steps.attached_medias', 'attached_medias')
      .leftJoinAndSelect(
        'attached_medias.active_storage_attachment_id',
        'active_storage_attachment_id',
      )
      .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
      .leftJoinAndSelect('troubleshoot.model_id', 'model')
      .where('troubleshoot.id = :id', { id })
      .getOne();

    if (!troubleshoot) {
      throw new NotFoundException('Troubleshoot not found');
    }

    return {
      troubleshoot: await this.convertToDetailDTO(troubleshoot),
      message: 'Success',
    };
  }

  async create(modelId: string, data: AddEditTroubleshootDto) {
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
      Troubleshoot,
      'title',
      data.title,
      {
        model_id: {
          id: modelId,
        },
      },
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const troubleshoot = queryRunner.manager.create(Troubleshoot, {
        title: data.title,
        model_id: {
          id: modelId,
        },
      });
      await queryRunner.manager.save(troubleshoot);

      await this.commonStepService.saveTroubleSteps(
        queryRunner,
        data.troubleshoot_steps_attributes,
        troubleshoot.id,
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(troubleshoot.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: AddEditTroubleshootDto) {
    const troubleshoot = await this.troubleshootRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!troubleshoot) {
      throw new NotFoundException(`Written Issue with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (data.title) {
        Object.assign(troubleshoot, {
          name: data.title,
        });
        await queryRunner.manager.save(Troubleshoot, troubleshoot);
      }

      await this.commonStepService.saveTroubleSteps(
        queryRunner,
        data.troubleshoot_steps_attributes,
        id,
      );
      await queryRunner.commitTransaction();

      const response = await this.getById(troubleshoot.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async approvalStatusUpdate(id: string, data: ApprovalStatusTroubleshootDto) {
    const troubleshoot = await this.troubleshootRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!troubleshoot) {
      throw new NotFoundException(`Troubleshoot with id ${id} not found`);
    }
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const troubleshootStep = await this.troubleshootStepRepository.findOne({
        where: { id: data.trouble_shoot_cause_id },
      });

      if (!troubleshootStep) {
        throw new NotFoundException(
          `Troubleshoot Step with id ${id} not found`,
        );
      }

      Object.assign(troubleshootStep, {
        approvalStatus: data.approval_status,
      });
      await queryRunner.manager.save(TroubleshootStep, troubleshootStep);
      await queryRunner.commitTransaction();
      return { message: 'Successfully updated the status' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async destroy(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const troubleshoot = await queryRunner.manager.findOne(Troubleshoot, {
        where: { id },
        relations: ['troubleshootSteps'],
      });

      if (!troubleshoot) {
        throw new NotFoundException(`Written Issue with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Troubleshoot,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.update(
        TroubleshootStep,
        {
          troubleshoot_id: id,
        },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(AttachedMedia, {
        mediable_id: In(troubleshoot.troubleshootSteps.map((x) => x.id)),
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully', troubleshoot };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
