import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttachedMedia, Model, Procedure, Step } from '@app/schema';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { SearchParamsDTO } from '@app/schema/dto';
import { DateUtilsService } from '@app/common-utils';
import {
  ProcedureDetailsDTO,
  ProcedureDetailsResponse,
  ProcedureResponse,
  ProcedureResponseDto,
} from './dto/procedure';
import { MediaService } from 'src/media/media.service';
import {
  AddProcedureDTORequest,
  EditProcedureDTORequest,
} from './dto/add-edit';
import { CommonStepService, CustomUniqueService } from '@app/schema/service';

@Injectable()
export class ProcedureService {
  constructor(
    private dataSource: DataSource,

    @Inject()
    private mediaService: MediaService,

    @InjectRepository(Procedure)
    private readonly procedureRepository: Repository<Procedure>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private convertToDTO(procedure: Procedure): ProcedureResponseDto {
    const response = new ProcedureResponseDto();
    response.id = procedure.id;
    response.title = procedure.name;
    response.model_id = procedure.model_id ? procedure.model_id.id : null;
    response.steps_count = (procedure.steps || []).length;
    response.media_count = (procedure.steps || []).reduce(
      (a, b) => a + b.attached_medias.length,
      0,
    );
    response.created_at = DateUtilsService.dateToString(procedure.created_at);
    return response;
  }

  private async converToStepDTO(step: Step) {
    const temp = {
      id: step.id,
      title: step.title,
      description: step.description,
      step_order: step.step_order,
      parameters: {
        skip: false,
      },
      attached_medias: [],
    };
    temp.attached_medias = await Promise.all(
      step.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
    return temp;
  }

  private async convertToDetailedDTO(
    procedure: Procedure,
  ): Promise<ProcedureDetailsDTO> {
    const response = new ProcedureDetailsDTO();
    response.id = procedure.id;
    response.name = procedure.name;
    response.steps = await Promise.all(
      procedure.steps.map((step) => this.converToStepDTO(step)),
    );
    return response;
  }

  async get(
    modelId: string,
    params: SearchParamsDTO,
  ): Promise<ProcedureResponse> {
    let queryBuilder = this.procedureRepository
      .createQueryBuilder('procedure')
      .leftJoinAndSelect('procedure.model_id', 'model')
      .leftJoinAndSelect(
        'procedure.steps',
        'steps',
        'steps.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect('steps.attached_medias', 'attached_medias')
      .where('procedure.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('procedure.model_id = :modelId', { modelId });

    // Handle searching
    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "(LOWER(procedure.name) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapedKeyword}%` },
      );
    }

    // Handle sorting
    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `procedure.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('procedure.updated_at', 'DESC');
    }

    // Handle pagination
    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    const [procedures, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const response: ProcedureResponse = {
      procedures: procedures.map((procedure) => this.convertToDTO(procedure)),
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      message: 'Success',
    };

    return response;
  }

  async getById(id: string): Promise<ProcedureDetailsResponse> {
    const procedure = await this.procedureRepository
      .createQueryBuilder('procedure')
      .leftJoinAndSelect('procedure.model_id', 'model')
      .leftJoinAndSelect(
        'procedure.steps',
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
      .where('procedure.id = :id', { id })
      .getOne();

    if (!procedure) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }

    return {
      message: 'Success',
      procedure: await this.convertToDetailedDTO(procedure),
    };
  }

  async create(modelId: string, data: AddProcedureDTORequest) {
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
      Procedure,
      'name',
      data.name,
      {
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
      const procedure = queryRunner.manager.create(Procedure, {
        name: data.name,
        model_id: model as any,
      });
      await queryRunner.manager.save(procedure);

      await this.commonStepService.saveSteps(
        queryRunner,
        data.steps_attributes || [],
        procedure.id,
        'Procedure',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(procedure.id);
      return response.procedure;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: EditProcedureDTORequest) {
    const procedure = await this.procedureRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!procedure) {
      throw new NotFoundException(`Written Issue with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (data.name) {
        Object.assign(procedure, {
          name: data.name,
        });
        await queryRunner.manager.save(Procedure, procedure);
      }

      await this.commonStepService.saveSteps(
        queryRunner,
        data.steps_attributes,
        id,
        'Procudure',
      );
      await queryRunner.commitTransaction();

      const response = await this.getById(procedure.id);

      return response;
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
      const procedure = await queryRunner.manager.findOne(Procedure, {
        where: { id },
        relations: ['steps'],
      });

      if (!procedure) {
        throw new NotFoundException(`Procedure with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Procedure,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.update(
        Step,
        {
          stepable_id: id,
        },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(AttachedMedia, {
        mediable_id: In(procedure.steps.map((x) => x.id)),
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return procedure;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
