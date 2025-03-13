import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, FindOptionsWhere, Not } from 'typeorm';

@Injectable()
export class CustomUniqueService {
  constructor(private dataSource: DataSource) {}

  async isExist<Entity>(
    table: EntityTarget<Entity>,
    key: string,
    value: string,
    otherWhere?: Record<string, any>,
    id?: string,
  ) {
    const whereCondition: FindOptionsWhere<any> = {
      [key]: value,
      is_deleted: false,
      ...(otherWhere || {}),
    };
    if (id) {
      whereCondition.id = Not(id);
    }
    if (otherWhere && otherWhere.model_id) {
      whereCondition.model_id = { id: otherWhere.model_id };
    }
    
    try {
      const entity = await this.dataSource.manager.findOne(table, {
        where: whereCondition,
        select: ['id'],
      });
      return !!entity;
    } catch (error) {
      console.error('Error in isExist query:', error);
      throw new Error('Query failed');
    }
  }
}
