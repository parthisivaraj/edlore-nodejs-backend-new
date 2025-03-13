import { SlaveMachine } from '@app/schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { QueryRunner, DataSource } from 'typeorm';
import { SlaveMachineDTO } from './dto/slave-machine';
import { CreateUpdateSlaveMachineDTO } from './dto/add-edit';

@Injectable()
export class SlaveMachineService {
  constructor(
    @InjectRepository(SlaveMachine)
    private readonly slaveMachineRepository: Repository<SlaveMachine>,
    private readonly dataSource: DataSource,
  ) {}

  private convertToDTO(slaveMachine: SlaveMachine): SlaveMachineDTO {
    const dto = new SlaveMachineDTO();
    dto.id = slaveMachine.id;
    dto.name = slaveMachine.name;
    dto.ipaddress = slaveMachine.ipaddress;
    dto.is_syncing = slaveMachine.is_syncing;
    dto.sync_status = slaveMachine.sync_status;
    dto.sync_start_at = slaveMachine.sync_start_at;
    dto.sync_end_at = slaveMachine.sync_end_at;
    dto.last_sync_at = slaveMachine.last_sync_at;
    dto.ping_status = slaveMachine.ping_status;
    return dto;
  }

  async get(): Promise<any> {
    const slaveMachines = await this.slaveMachineRepository.find();
    const data = slaveMachines.map((machine) => this.convertToDTO(machine));
    return { data };
  }

  async getById(id: string): Promise<SlaveMachineDTO> {
    const slaveMachine = await this.slaveMachineRepository.findOne({
      where: { id },
    });

    if (!slaveMachine) {
      throw new NotFoundException(`SlaveMachine with id ${id} not found`);
    }

    return this.convertToDTO(slaveMachine);
  }

  async create(data: CreateUpdateSlaveMachineDTO): Promise<SlaveMachineDTO> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingMachine = await queryRunner.manager.findOne(SlaveMachine, {
        where: { ipaddress: data.ipaddress },
      });

      if (existingMachine) {
        throw new Error('IP Address must be unique');
      }

      const slaveMachine = queryRunner.manager.create(SlaveMachine, data);
      await queryRunner.manager.save(slaveMachine);

      await queryRunner.commitTransaction();
      return this.convertToDTO(slaveMachine);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    data: CreateUpdateSlaveMachineDTO,
  ): Promise<SlaveMachineDTO> {
    const slaveMachine = await this.slaveMachineRepository.findOne({
      where: { id },
    });

    if (!slaveMachine) {
      throw new NotFoundException(`SlaveMachine with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingMachine = await queryRunner.manager.findOne(SlaveMachine, {
        where: { ipaddress: data.ipaddress, id: Not(id) },
      });

      if (existingMachine) {
        throw new Error('IP Address must be unique');
      }

      Object.assign(slaveMachine, data);
      await queryRunner.manager.save(slaveMachine);

      await queryRunner.commitTransaction();
      return this.convertToDTO(slaveMachine);
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
      const slaveMachine = await queryRunner.manager.findOne(SlaveMachine, {
        where: { id },
      });

      if (!slaveMachine) {
        throw new NotFoundException(`SlaveMachine with id ${id} not found`);
      }
      await queryRunner.manager.remove(SlaveMachine, slaveMachine);

      await queryRunner.commitTransaction();

      return { message: 'Deleted Successfully', title: slaveMachine.name };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
