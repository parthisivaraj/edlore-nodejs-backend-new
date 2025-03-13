import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { DataSource, EntityManager } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CustomUniqueValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private dataSource: DataSource,
  ) {}

  async validate(value: string, args: ValidationArguments) {
    const [tableName, column] = args?.constraints as string[];

    const dataExist = await this.entityManager
      .getRepository(tableName)
      .createQueryBuilder(tableName)
      .where({ [column]: value, is_deleted: false })
      .getExists();

    return !dataExist;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} should be unique`;
  }
}
