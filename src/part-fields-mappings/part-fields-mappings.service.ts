import { PartFieldsMappings } from '@app/schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { QueryRunner, DataSource } from 'typeorm';
import { PartFieldsMappingsDTO } from './dto/part-fields-mappings';
import { CreateUpdatePartFieldsMappingsDTO } from './dto/add-edit';

@Injectable()
export class PartFieldsMappingsService {
  constructor(
    @InjectRepository(PartFieldsMappings)
    private readonly partFieldsMappingsRepository: Repository<PartFieldsMappings>,
    private readonly dataSource: DataSource,
  ) {}

  private convertToDTO(partFieldsMappings: PartFieldsMappings): PartFieldsMappingsDTO {
    const dto = new PartFieldsMappingsDTO();
    dto.id = partFieldsMappings.id;
    dto.part_field_id = partFieldsMappings.part_field_id;
    dto.part_id = partFieldsMappings.part_id;
    dto.value = partFieldsMappings.value;
    return dto;
  }

  async getByPartId(part_id: string): Promise<any> {
      // const partfieldsmappings = await this.partFieldsMappingsRepository
      //   .createQueryBuilder('part_fields_mappings')
      //   .where('part_fields_mappings.part_id = :part_id', { part_id })

      const partfieldsmappings = await this.partFieldsMappingsRepository.find({
          where: {
            part_id: part_id,
          },
        });
  
      const data = partfieldsmappings.map((mapping) => this.convertToDTO(mapping));
      return { data };
    }

  async create(data: CreateUpdatePartFieldsMappingsDTO): Promise<PartFieldsMappingsDTO> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // await queryRunner.manager.delete(PartFieldsMappings, { part_id: data[0].part_id });
      const partFields = queryRunner.manager.create(PartFieldsMappings, data);
      await queryRunner.manager.save(partFields);

      await queryRunner.commitTransaction();
      return this.convertToDTO(partFields);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
