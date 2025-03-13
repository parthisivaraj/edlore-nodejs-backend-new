import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { AddEditRealiseNoteDto } from './dto/add-edit';
import { GetRealiseNoteDto } from './dto/realise-note';
import { RealiseNoteEntity } from '@app/schema';

@Injectable()
export class RealiseNoteService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RealiseNoteEntity)
    private readonly realiseNoteRepository: Repository<RealiseNoteEntity>,
  ) {}

  async get(): Promise<GetRealiseNoteDto[]> {
    const data = await this.realiseNoteRepository.find();
    return data.map((note) => ({
      id: note.id,
      title: note.title,
      description: note.description,
      created_at: note.created_at,
      updated_at: note.updated_at,
      is_deleted: note.is_deleted,
    }));
  }

  async save(data: AddEditRealiseNoteDto): Promise<RealiseNoteEntity> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const realiseNote = this.realiseNoteRepository.create({
        title: data.title,
        description: data.description,
      });

      const savedNote = await queryRunner.manager.save(
        RealiseNoteEntity,
        realiseNote,
      );

      await queryRunner.commitTransaction();

      return savedNote;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        'Failed to save realise note',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
