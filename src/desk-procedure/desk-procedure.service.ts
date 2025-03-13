import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Procedure, Step } from '@app/schema';
import { Repository } from 'typeorm';
import { DateUtilsService } from '@app/common-utils';
import { MediaService } from 'src/media/media.service';
import {
  ProcedureDetailsResponse,
  ProcedureResponse,
  ProcedureResponseDto,
  ProcedureSearchParams,
} from './dto/desk-procedure';
import { FilterService } from '@app/schema/service';

@Injectable()
export class DeskProcedureService {
  constructor(
    @Inject() private mediaService: MediaService,
    @InjectRepository(Procedure)
    private readonly procedureRepository: Repository<Procedure>,

    private filterService: FilterService,
  ) {}

  private convertToDTO(procedure: Procedure): ProcedureResponseDto {
    const response = new ProcedureResponseDto();
    response.id = procedure.id;
    response.title = procedure.name;
    response.model_id = procedure.model_id ? procedure.model_id.id : null;
    response.steps_count = procedure.steps ? procedure.steps.length : 0;
    response.media_count = (procedure.steps || []).reduce(
      (a, b) => a + (b.attached_medias || []).length,
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
  ): Promise<ProcedureResponseDto> {
    const response = this.convertToDTO(procedure);
    response.steps = await Promise.all(
      procedure.steps.map((step) => this.converToStepDTO(step)),
    );
    return response;
  }

  async get(params: ProcedureSearchParams): Promise<ProcedureResponse> {
    let queryBuilder = this.procedureRepository
      .createQueryBuilder('procedure')
      .leftJoinAndSelect('procedure.model_id', 'model')
      .leftJoinAndSelect('procedure.steps', 'step')
      .where('procedure.is_deleted = :isDeleted', { isDeleted: false });

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

    const selected_filters = { models: [] };

    if (params.filters) {
      const { models } = params.filters;

      selected_filters.models = models || [];

      if (models && models.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'procedure.model_id IN (:...models)',
          {
            models,
          },
        );
      }
    }

    // Handle pagination
    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    const [procedures, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'procedures',
    );

    const response: ProcedureResponse = {
      procedures: procedures.map((procedure) => this.convertToDTO(procedure)),
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      filters,
    };

    return response;
  }

  async getById(id: string): Promise<ProcedureDetailsResponse> {
    const procedure = await this.procedureRepository
      .createQueryBuilder('procedure')
      .leftJoinAndSelect('procedure.model_id', 'model')
      .leftJoinAndSelect('procedure.steps', 'steps')
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
}
