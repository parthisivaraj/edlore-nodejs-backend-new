import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AllProcedureResponseDTO,
  AllTroubleshootResponseDTO,
  ErrorCodeDetailResponse,
  ErrorCodeResponse,
  ErrorCodeResponseDto,
  ListLinkingDTO,
  ListLinkingParamDTO,
  Procedure,
  Troubleshoot,
} from './dto/error-code';
import { SearchParamsDTO } from '@app/schema/dto';
import { DateUtilsService } from '@app/common-utils';
import {
  ErrorCode,
  ErrorCodeLinking,
  ErrorCodeLinkingType,
  ErrorCodeMachineType,
  Model,
  Procedure as ProcedureSchema,
  Troubleshoot as TroubleshootSchema,
} from '@app/schema';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { MediaService } from 'src/media/media.service';
import { CustomUniqueService } from '@app/schema/service';
import {
  AddEditErrorCodeDTO,
  ErrorCodeLinkingsAttribute,
  ErrorCodeMachineTypeAttribute,
  LinkProceduresRequest,
  LinkTroubleshootsRequest,
} from './dto/add-edit';

@Injectable()
export class ErrorCodeService {
  constructor(
    @InjectRepository(ErrorCode)
    private readonly errorCodeRepository: Repository<ErrorCode>,

    @InjectRepository(ErrorCodeLinking)
    private readonly errorCodeLinkingRepository: Repository<ErrorCodeLinking>,

    @InjectRepository(Model)
    private readonly modelRespository: Repository<Model>,

    @InjectRepository(ProcedureSchema)
    private readonly procedureRespository: Repository<ProcedureSchema>,

    @InjectRepository(TroubleshootSchema)
    private readonly troubleshootRespository: Repository<TroubleshootSchema>,

    @Inject()
    private mediaService: MediaService,

    private dataSource: DataSource,
    private customUniqueService: CustomUniqueService,
  ) {}

  private convertToDTO(errorCode: ErrorCode): ErrorCodeResponseDto {
    const response = new ErrorCodeResponseDto();
    response.id = errorCode.id;
    response.title = errorCode.title;
    response.code = errorCode.code;
    response.description = errorCode.description || '';
    response.procedure_count = errorCode.errorCodeLinkings.filter(
      (x) => x.linkable_type === ErrorCodeLinkingType.Procedure,
    ).length;
    response.troubleshoot_count = errorCode.errorCodeLinkings.filter(
      (x) => x.linkable_type === ErrorCodeLinkingType.Troubleshoot,
    ).length;
    response.media_count = errorCode.attached_medias.length;
    response.error_type = ErrorCode[errorCode.error_type];
    response.created_at = DateUtilsService.dateToString(errorCode.created_at);
    return response;
  }

  private convertToProcedureDTO(
    errorCodeLinkings: ErrorCodeLinking[],
  ): Procedure[] {
    return errorCodeLinkings.map((item) => ({
      id: item.procedure.id,
      link_id: item.id,
      steps_count: (item.procedure.steps || []).length,
      title: item.procedure.name,
    }));
  }

  private convertToTroubleshootDTO(
    errorCodeLinkings: ErrorCodeLinking[],
  ): Troubleshoot[] {
    return errorCodeLinkings.map((item) => ({
      id: item.troubleshoot.id,
      link_id: item.id,
      steps_count: (item.troubleshoot.troubleshootSteps || []).length,
      title: item.troubleshoot.title,
    }));
  }

  private async convertToDetailDTO(
    errorCode: ErrorCode,
  ): Promise<ErrorCodeResponseDto> {
    const response = await this.convertToDTO(errorCode);
    response.procedures = this.convertToProcedureDTO(
      errorCode.errorCodeLinkings.filter(
        (x) => x.linkable_type === ErrorCodeLinkingType.Procedure,
      ),
    );
    response.troubleshoots = this.convertToTroubleshootDTO(
      errorCode.errorCodeLinkings.filter(
        (x) => x.linkable_type === ErrorCodeLinkingType.Troubleshoot,
      ),
    );
    response.attached_medias = await Promise.all(
      errorCode.attached_medias
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
    params: SearchParamsDTO,
    currentUser: string,
    message: string = 'Success',
  ): Promise<ErrorCodeResponse & { current_user: string; message: string }> {
    let queryBuilder = this.errorCodeRepository
      .createQueryBuilder('errorCode')
      .leftJoinAndSelect('errorCode.model', 'model')
      .leftJoinAndSelect('errorCode.errorCodeLinkings', 'errorCodeLinkings')
      .leftJoinAndSelect('errorCode.attached_medias', 'attached_medias')
      .leftJoinAndSelect('errorCode.errorCodeMachineTypes', 'machineTypes')
      .where('errorCode.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('errorCode.model_id = :modelId', { modelId });

    if (type) {
      queryBuilder = queryBuilder.andWhere({
        error_type: type,
      });
    }

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "(LOWER(errorCode.title) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(errorCode.code) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `errorCode.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('errorCode.updated_at', 'DESC');
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [errorCodes, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      errors: errorCodes.map((errorCode) => this.convertToDTO(errorCode)),
      current_user: currentUser,
      message: message,
    };
  }

  async getById(id: string): Promise<ErrorCodeDetailResponse> {
    const errorCode = await this.errorCodeRepository
      .createQueryBuilder('errorCode')
      .leftJoinAndSelect('errorCode.model', 'model')
      .leftJoinAndSelect('errorCode.errorCodeLinkings', 'errorCodeLinkings')
      .leftJoinAndSelect('errorCodeLinkings.procedure', 'procedure')
      .leftJoinAndSelect('errorCodeLinkings.troubleshoot', 'troubleshoot')
      .leftJoinAndSelect('troubleshoot.troubleshootSteps', 'troubleshootSteps')
      .leftJoinAndSelect('procedure.steps', 'procudereSteps')
      .leftJoinAndSelect('errorCode.attached_medias', 'attached_medias')
      .leftJoinAndSelect('errorCode.errorCodeMachineTypes', 'machineTypes')
      .where('errorCode.id = :id', { id })
      .getOne();

    if (!errorCode) {
      throw new NotFoundException('Error Code not found');
    }

    const errorResponse: ErrorCodeResponseDto =
      await this.convertToDetailDTO(errorCode);

    return {
      message: 'Success',
      error: errorResponse,
    };
  }

  private async saveErrorCodeLinking(
    queryRunner: QueryRunner,
    linkings: ErrorCodeLinkingsAttribute[],
    error_code_id: string,
  ) {
    for (const linking of linkings) {
      if (linking._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.delete(ErrorCodeLinking, { id: linking.id });
      } else {
        // Update or add new steps
        const error_code = queryRunner.manager.create(ErrorCodeLinking, {
          error_code_id,
          linkable_id: linking.linkable_id,
          linkable_type:
            linking.linkable_type === 'Troubleshoot'
              ? ErrorCodeLinkingType.Troubleshoot
              : ErrorCodeLinkingType.Procedure,
        });

        await queryRunner.manager.save(ErrorCodeLinking, error_code);
      }
    }
  }

  private async saveErrorCodeMachineType(
    queryRunner: QueryRunner,
    linkings: ErrorCodeMachineTypeAttribute[],
    error_code_id: string,
  ) {
    for (const linking of linkings) {
      if (linking._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.delete(ErrorCodeMachineType, {
          id: linking.id,
        });
      } else {
        // Update or add new steps
        const error_code = queryRunner.manager.create(ErrorCodeMachineType, {
          machine_type: linking.machine_type,
          errorCode: {
            id: error_code_id,
          },
        });

        await queryRunner.manager.save(ErrorCodeLinking, error_code);
      }
    }
  }

  async create(modelId: string, data: AddEditErrorCodeDTO) {
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
      ErrorCode,
      'title',
      data.title,
      {
        model: { id: modelId },
      },
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const errorCode = queryRunner.manager.create(ErrorCode, {
        title: data.title,
        description: data.description,
        code: data.code,
        error_type: data.error_type,
        model: model,
      });
      await queryRunner.manager.save(errorCode);

      if ((data.error_code_linkings_attributes || []).length > 0) {
        await this.saveErrorCodeLinking(
          queryRunner,
          data.error_code_linkings_attributes,
          errorCode.id,
        );
      }

      if ((data.error_code_machine_type_attributes || []).length > 0) {
        await this.saveErrorCodeMachineType(
          queryRunner,
          data.error_code_machine_type_attributes,
          errorCode.id,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(errorCode.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: AddEditErrorCodeDTO) {
    const errorCode = await this.errorCodeRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['model'],
    });

    if (!errorCode) {
      throw new NotFoundException(`Error Code with id ${id} not found`);
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      ErrorCode,
      'title',
      data.title,
      {
        model: { id: errorCode.model.id },
      },
      id,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(errorCode, {
        title: data.title,
        description: data.description,
        code: data.code,
        error_type: data.error_type,
      });
      await queryRunner.manager.save(ErrorCode, errorCode);

      if ((data.error_code_linkings_attributes || []).length > 0) {
        await this.saveErrorCodeLinking(
          queryRunner,
          data.error_code_linkings_attributes,
          errorCode.id,
        );
      }

      if ((data.error_code_machine_type_attributes || []).length > 0) {
        await this.saveErrorCodeMachineType(
          queryRunner,
          data.error_code_machine_type_attributes,
          errorCode.id,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(errorCode.id);
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
      const errorCode = await queryRunner.manager.findOne(ErrorCode, {
        where: { id },
      });

      if (!errorCode) {
        throw new NotFoundException(`Error Code with id ${id} not found`);
      }

      await queryRunner.manager.update(
        ErrorCode,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(ErrorCodeLinking, {
        error_code_id: id,
      });

      await queryRunner.manager.delete(ErrorCodeMachineType, {
        errorCode: { id },
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully', error: errorCode };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async getListLinking(
    id: string,
    params: ListLinkingParamDTO,
  ): Promise<ListLinkingDTO> {
    let queryBuilder = this.errorCodeLinkingRepository
      .createQueryBuilder('errorCodeLinkings')
      .leftJoinAndSelect('errorCodeLinkings.procedure', 'procedure')
      .leftJoinAndSelect('errorCodeLinkings.troubleshoot', 'troubleshoot')
      .leftJoinAndSelect('troubleshoot.troubleshootSteps', 'troubleshootSteps')
      .leftJoinAndSelect('procedure.steps', 'procudereSteps')
      .where('errorCodeLinkings.linkable_type = :linkable_type', {
        linkable_type: params.type,
      })
      .andWhere('errorCodeLinkings.error_code_id = :error_code_id', {
        error_code_id: id,
      });

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [errorCodes, total] = await queryBuilder.getManyAndCount();

    if (params.type === 'Procedure') {
      return {
        pagination: {
          total_entries: total,
          current_page: params.page,
          per_page: take,
          offset: skip,
        },
        procedures: this.convertToProcedureDTO(errorCodes),
      };
    }

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      troubleshoots: this.convertToTroubleshootDTO(errorCodes),
    };
  }

  async linked_procedures(
    id: string,
    params: SearchParamsDTO,
  ): Promise<ListLinkingDTO> {
    let queryBuilder = this.errorCodeLinkingRepository
      .createQueryBuilder('errorCodeLinkings')
      .leftJoinAndSelect('errorCodeLinkings.procedure', 'procedure')
      .leftJoinAndSelect('procedure.steps', 'procudereSteps')
      .where('errorCodeLinkings.linkable_type = :linkable_type', {
        linkable_type: 'Procedure',
      })
      .andWhere('errorCodeLinkings.error_code_id = :error_code_id', {
        error_code_id: id,
      });

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [errorCodes, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      procedures: this.convertToProcedureDTO(errorCodes),
    };
  }

  async linked_troubleshoots(
    id: string,
    params: SearchParamsDTO,
  ): Promise<ListLinkingDTO> {
    let queryBuilder = this.errorCodeLinkingRepository
      .createQueryBuilder('errorCodeLinkings')
      .leftJoinAndSelect('errorCodeLinkings.troubleshoot', 'troubleshoot')
      .leftJoinAndSelect('troubleshoot.troubleshootSteps', 'troubleshootSteps')
      .where('errorCodeLinkings.linkable_type = :linkable_type', {
        linkable_type: 'Troubleshoot',
      })
      .andWhere('errorCodeLinkings.error_code_id = :error_code_id', {
        error_code_id: id,
      });

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [errorCodes, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      troubleshoots: this.convertToTroubleshootDTO(errorCodes),
    };
  }

  async all_procedures(
    id: string,
    params: SearchParamsDTO,
  ): Promise<AllProcedureResponseDTO> {
    const error = await this.errorCodeLinkingRepository.find({
      where: {
        error_code_id: id,
        linkable_type: ErrorCodeLinkingType.Procedure,
      },
      select: ['procedure'],
    });
    if (!error) {
      throw new Error('Error not found');
    }

    const ids = error.map((error) => error.procedure.id);

    let queryBuilder =
      this.procedureRespository.createQueryBuilder('procedure');

    if (ids.length > 0) {
      queryBuilder = queryBuilder
        .andWhere(
          '(procedure.id IN (:...ids) OR procedure.id NOT IN (:...ids))',
          {
            ids,
          },
        )
        .addSelect(
          `CASE WHEN procedure.id IN (:...ids) THEN 0 ELSE 1 END`,
          'rank',
        ) // Add computed field
        .orderBy('rank', 'ASC')
        .addOrderBy('procedure.created_at', 'DESC')
        .setParameter('ids', ids);
    } else {
      queryBuilder = queryBuilder.orderBy('procedure.created_at', 'DESC');
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(procedure.name) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [procedures, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      linked_procedure_ids: ids,
      procedures: procedures.map((item) => ({
        id: item.id,
        title: item.name,
      })),
    };
  }

  async all_troubleshoots(
    id: string,
    params: SearchParamsDTO,
  ): Promise<AllTroubleshootResponseDTO> {
    const error = await this.errorCodeLinkingRepository.find({
      where: {
        error_code_id: id,
        linkable_type: ErrorCodeLinkingType.Troubleshoot,
      },
      select: ['troubleshoot'],
    });
    if (!error) {
      throw new Error('Error not found');
    }

    const ids = error.map((error) => error.troubleshoot.id);

    let queryBuilder =
      this.troubleshootRespository.createQueryBuilder('troubleshoot');

    if (ids.length > 0) {
      queryBuilder = queryBuilder
        .andWhere(
          '(troubleshoot.id IN (:...ids) OR troubleshoot.id NOT IN (:...ids))',
          {
            ids,
          },
        )
        .addSelect(
          `CASE WHEN troubleshoot.id IN (:...ids) THEN 0 ELSE 1 END`,
          'rank',
        ) // Add computed field
        .orderBy('rank', 'ASC')
        .addOrderBy('troubleshoot.created_at', 'DESC')
        .setParameter('ids', ids);
    } else {
      queryBuilder = queryBuilder.orderBy('troubleshoot.created_at', 'DESC');
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(troubleshoot.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [troubleshoots, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      linked_troubleshoot_ids: ids,
      troubleshoots: troubleshoots.map((item) => ({
        id: item.id,
        title: item.title,
      })),
    };
  }

  async link_procedures(id: string, data: LinkProceduresRequest) {
    const errorCode = await this.errorCodeRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!errorCode) {
      throw new NotFoundException(`Error Code with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(ErrorCodeLinking, {
        error_code_id: id,
        linkable_type: ErrorCodeLinkingType.Procedure,
      });

      if ((data.linked_procedure_ids || []).length > 0) {
        await this.saveErrorCodeLinking(
          queryRunner,
          data.linked_procedure_ids.map((item) => ({
            linkable_id: item,
            linkable_type: ErrorCodeLinkingType.Procedure,
          })),
          errorCode.id,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(errorCode.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async link_troubleshoots(id: string, data: LinkTroubleshootsRequest) {
    const errorCode = await this.errorCodeRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!errorCode) {
      throw new NotFoundException(`Error Code with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(ErrorCodeLinking, {
        error_code_id: id,
        linkable_type: ErrorCodeLinkingType.Troubleshoot,
      });

      if ((data.linked_troubleshoot_ids || []).length > 0) {
        await this.saveErrorCodeLinking(
          queryRunner,
          data.linked_troubleshoot_ids.map((item) => ({
            linkable_id: item,
            linkable_type: ErrorCodeLinkingType.Troubleshoot,
          })),
          errorCode.id,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = await this.getById(errorCode.id);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
