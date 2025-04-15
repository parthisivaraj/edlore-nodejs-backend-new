import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchParamsDTO } from '@app/schema/dto';
import {
  EditSectionResponse,
  SectionResponse,
  SectionResponseDto,
} from './dto/section';
import { Device, Model, Procedure, Section } from '@app/schema';
import { DateUtilsService } from '@app/common-utils';
import { AddEditSectionDTORequest } from './dto/add-edit';
import { CustomUniqueService } from '@app/schema/service';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,

    private customUniqueService: CustomUniqueService,
  ) {}

  private convertToDTO(section: Section): SectionResponseDto {
    const response = new SectionResponseDto();
    response.id = section.id;
    response.title = section.title;
    response.created_at = DateUtilsService.dateToString(section.created_at);
    return response;
  }

  async get(
    modelId: string,
    params: SearchParamsDTO,
  ): Promise<SectionResponse> {
    let queryBuilder = this.sectionRepository
      .createQueryBuilder('section')
      .where('section.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('section.model_id = :modelId', { modelId });

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

    if (params.sort_column && params.sort_order) {
      if (['name', 'modelId'].includes(params.sort_column)) {
        queryBuilder = queryBuilder.orderBy(
          `LOWER(section.${params.sort_column})`,
          params.sort_order,
        );
      } else {
        queryBuilder = queryBuilder.orderBy(
          `section.${params.sort_column}`,
          params.sort_order,
        );
      }
    } else {
      queryBuilder = queryBuilder.orderBy('section.updated_at', 'DESC');
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);

    const [sections, total] = await queryBuilder.getManyAndCount();

    return {
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      sections: sections.map((section) => this.convertToDTO(section)),
    };
  }

  async getById(id: string) {
    const section = await this.sectionRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return {
      section: this.convertToDTO(section),
    };
  }

  // Creates a new section
  async create(
    modelId: string,
    data: AddEditSectionDTORequest,
  ): Promise<Section> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
    });

    // If the model is not found, throw an error
    if (!model) {
      throw new BadRequestException({
        error: `Model with ID ${modelId} not found`,
      });
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Section,
      'title',
      data.title,
      {
        model_id: modelId,
      },
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const section = this.sectionRepository.create({
      title: data.title,
      model_id: model,
      is_deleted: false,
    });
    const savedSection = await this.sectionRepository.save(section);
    return savedSection;
  }

  // Updates an existing section
  async update(
    id: string,
    modelId: string,
    data: AddEditSectionDTORequest,
  ): Promise<EditSectionResponse> {
    const duplicateTitle = await this.customUniqueService.isExist(
      Section,
      'title',
      data.title,
      {
        model_id: modelId,
      },
      id,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const result = await this.sectionRepository.update(id, {
      ...data,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }
    const updatedSection = await this.sectionRepository.findOne({
      where: { id },
    });

    return {
      message: 'Section Updated Successfully',
      section: updatedSection,
    };
  }

  //  deletes a section by ID
  async remove(id: string) {
    const queryRunner =
      this.sectionRepository.manager.connection.createQueryRunner();

    await queryRunner.startTransaction();

    try {
      const section = await queryRunner.manager.findOne(Section, {
        where: { id },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      await queryRunner.manager.update(Section, id, { is_deleted: true });

      await queryRunner.manager.update(
        Device,
        { model_id: section.model_id },
        { is_deleted: true },
      );

      await queryRunner.manager.update(
        Procedure,
        { model_id: section.model_id },
        { is_deleted: true },
      );

      await queryRunner.commitTransaction();

      return { message: 'Successfully deleted', title: section.title };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
