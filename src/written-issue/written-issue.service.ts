import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { AttachedMedia, Section, Step, WrittenIssue } from '@app/schema';
import {
  WrittenIssueDetailDto,
  WrittenIssueDetailResponseDto,
  WrittenIssueResponse,
  WrittenIssueResponseDto,
  WrittenIssueSearchParams,
} from './dto/written-issue';
import { DateUtilsService } from '@app/common-utils';
import {
  CommonStepService,
  CustomUniqueService,
  FilterService,
} from '@app/schema/service';
import { AttachedMediaDTO } from '@app/schema/dto';
import { MediaService } from 'src/media/media.service';
import { AddRequestDTO, UpdateRequestDTO } from './dto/add-edit';

@Injectable()
export class WrittenIssueService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(WrittenIssue)
    private readonly writtenIssueRepository: Repository<WrittenIssue>,

    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,

    private filterService: FilterService,
    private mediaService: MediaService,
    private customUniqueService: CustomUniqueService,
    private commonStepService: CommonStepService,
  ) {}

  private convertToDTO(writtenIssue: WrittenIssue): WrittenIssueResponseDto {
    const response = new WrittenIssueResponseDto();
    response.id = writtenIssue.id;
    response.name = writtenIssue.name;
    response.solution_count = writtenIssue.steps
      ? writtenIssue.steps.length
      : 0;
    response.section_id = writtenIssue.section_id?.id || null;
    response.section_title = writtenIssue.section_id?.title || null;
    response.created_at = DateUtilsService.dateToString(
      writtenIssue.created_at,
    );
    return response;
  }

  private async mediaDTO(troubleshootStep: Step): Promise<AttachedMediaDTO[]> {
    return await Promise.all(
      troubleshootStep.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
  }

  private async convertToDetailsDTO(
    writtenIssue: WrittenIssue,
  ): Promise<WrittenIssueDetailDto> {
    const response = new WrittenIssueDetailDto();
    response.id = writtenIssue.id;
    response.name = writtenIssue.name;
    response.steps = await Promise.all(
      (writtenIssue.steps || []).map(async (step) => {
        return {
          id: step.id,
          title: step.title,
          description: step.description,
          step_order: step.step_order,
          created_at: DateUtilsService.dateToString(step.created_at),
          attached_medias: await this.mediaDTO(step),
        };
      }),
    );
    response.section_id = writtenIssue.section_id?.id || null;
    return response;
  }

  async get(
    modelId: string,
    params: WrittenIssueSearchParams,
  ): Promise<WrittenIssueResponse> {
    let queryBuilder = this.writtenIssueRepository
      .createQueryBuilder('writtenIssue')
      .leftJoinAndSelect(
        'writtenIssue.steps',
        'steps',
        'steps.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect('writtenIssue.section_id', 'section')
      .where('writtenIssue.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('writtenIssue.model_id = :modelId', { modelId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(writtenIssue.name) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `writtenIssue.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('writtenIssue.updated_at', 'DESC');
    }

    const selected_filters = { sections: [] };

    if (params.filters) {
      const { sections } = params.filters;

      selected_filters.sections = sections || [];

      if (sections && sections.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'writtenIssue.section_id IN (:...sections)',
          {
            sections,
          },
        );
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [writtenIssues, total] = await queryBuilder.getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'sections_only',
      modelId,
    );

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      written_issues: writtenIssues.map((issue) => this.convertToDTO(issue)),
      filters,
    };
  }

  async getBySection(
    modelId: string,
    sectionId: string,
    params: WrittenIssueSearchParams,
  ): Promise<WrittenIssueResponse> {
    let queryBuilder = this.writtenIssueRepository
      .createQueryBuilder('writtenIssue')
      .leftJoinAndSelect(
        'writtenIssue.steps',
        'steps',
        'steps.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect('writtenIssue.section_id', 'section')
      .where('writtenIssue.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('writtenIssue.model_id = :modelId', { modelId })
      .andWhere('writtenIssue.section_id = :sectionId', { sectionId });

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(section.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    const selected_filters = { sections: [] };

    if (params.filters) {
      const { sections } = params.filters;

      selected_filters.sections = sections || [];

      if (sections && sections.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'writtenIssue.section_id IN (:...sections)',
          {
            sections,
          },
        );
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.skip(skip).take(take);

    const [writtenIssues, total] = await queryBuilder.getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'sections_only',
      modelId,
    );

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      written_issues: writtenIssues.map((issue) => this.convertToDTO(issue)),
      filters,
    };
  }

  async getById(
    sectionId: string,
    id: string,
  ): Promise<WrittenIssueDetailResponseDto> {
    const writtenIssue = await this.writtenIssueRepository
      .createQueryBuilder('writtenIssue')
      .leftJoinAndSelect(
        'writtenIssue.steps',
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
      .where('writtenIssue.id = :id', { id })
      .andWhere('writtenIssue.section_id = :sectionId', { sectionId })
      .getOne();

    if (!writtenIssue) {
      throw new NotFoundException('Written issue not found');
    }

    return {
      message: 'Success',
      written_issues: await this.convertToDetailsDTO(writtenIssue),
    };
  }

  async create(sectionId: string, data: AddRequestDTO) {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
    });

    // If the section is not found, throw an error
    if (!section) {
      throw new BadRequestException({
        error: `Section with ID ${sectionId} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      WrittenIssue,
      'name',
      data.name,
      {
        section_id: {
          id: sectionId,
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
      const writtenIssue = queryRunner.manager.create(WrittenIssue, {
        name: data.name,
        section_id: section,
        model: data.model_id as any,
      });
      await queryRunner.manager.save(writtenIssue);

      await this.commonStepService.saveSteps(
        queryRunner,
        data.steps_attributes,
        writtenIssue.id,
        'WrittenIssue',
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return {
        ...writtenIssue,
        section_id: writtenIssue.section_id.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: UpdateRequestDTO) {
    const writtenIssue = await this.writtenIssueRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!writtenIssue) {
      throw new NotFoundException(`Written Issue with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (data.name) {
        Object.assign(writtenIssue, {
          name: data.name,
        });
        await queryRunner.manager.save(WrittenIssue, writtenIssue);
      }

      await this.commonStepService.saveSteps(
        queryRunner,
        data.steps_attributes,
        id,
        'WrittenIssue',
      );
      await queryRunner.commitTransaction();

      return {
        written_issue: {
          ...writtenIssue,
          section_id: writtenIssue.section_id.id as any,
        },
        message: 'Issue Updated Successfully',
        name: writtenIssue.name,
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
      const writtenIssue = await queryRunner.manager.findOne(WrittenIssue, {
        where: { id },
        relations: ['steps'],
      });

      if (!writtenIssue) {
        throw new NotFoundException(`Written Issue with id ${id} not found`);
      }

      await queryRunner.manager.update(
        WrittenIssue,
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
        mediable_id: In(writtenIssue.steps.map((x) => x.id)),
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
