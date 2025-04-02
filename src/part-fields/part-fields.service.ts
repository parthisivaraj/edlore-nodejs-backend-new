import { PartFields } from '@app/schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { QueryRunner, DataSource } from 'typeorm';
import { PartFieldsDTO } from './dto/part-fields';
import { CreateUpdatePartFieldsDTO } from './dto/add-edit';

@Injectable()
export class PartFieldsService {
  constructor(
    @InjectRepository(PartFields)
    private readonly partFieldsRepository: Repository<PartFields>,
    private readonly dataSource: DataSource,
  ) {}

  private convertToDTO(partFields: PartFields): PartFieldsDTO {
    const dto = new PartFieldsDTO();
    dto.id = partFields.id;
    dto.name = partFields.name;
    return dto;
  }

  async get(): Promise<any> {
    const partFieldss = await this.partFieldsRepository.find();
    const data = partFieldss.map((machine) => this.convertToDTO(machine));
    return { data };
  }

  async getById(id: string): Promise<PartFieldsDTO> {
    const partFields = await this.partFieldsRepository.findOne({
      where: { id },
    });

    if (!partFields) {
      throw new NotFoundException(`PartFields with id ${id} not found`);
    }

    return this.convertToDTO(partFields);
  }

  async create(data: CreateUpdatePartFieldsDTO): Promise<PartFieldsDTO> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPartFields = await queryRunner.manager.findOne(PartFields, {
        where: { name: data.name },
      });

      if (existingPartFields) {
        throw new Error('Name must be unique');
      }

      const partFields = queryRunner.manager.create(PartFields, data);
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

  async update(
    id: string,
    data: CreateUpdatePartFieldsDTO,
  ): Promise<PartFieldsDTO> {
    const partFields = await this.partFieldsRepository.findOne({
      where: { id },
    });

    if (!partFields) {
      throw new NotFoundException(`PartFields with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPartFields = await queryRunner.manager.findOne(PartFields, {
        where: { name: data.name, id: Not(id) },
      });

      if (existingPartFields) {
        throw new Error('Name must be unique');
      }

      Object.assign(partFields, data);
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

  async remove(id: string): Promise<{ message: string; title: string }> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const partFields = await queryRunner.manager.findOne(PartFields, {
        where: { id },
      });

      if (!partFields) {
        throw new NotFoundException(`PartFields with id ${id} not found`);
      }
      await queryRunner.manager.remove(PartFields, partFields);

      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully', title: partFields.name };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
