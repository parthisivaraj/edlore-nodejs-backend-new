import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Model } from './model.entity'; // Adjust the import path accordingly
import { IsNotEmpty, MaxLength } from 'class-validator';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ length: 150, unique: true, nullable: false })
  @IsNotEmpty({ message: 'Name should be present' })
  @MaxLength(150, { message: 'Maximum of 150 characters allowed' })
  name: string;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  @IsNotEmpty({ message: 'Please select the status' })
  status: CategoryStatus;

  @ManyToOne(() => Organization, (organization) => organization.categories, {
    nullable: true,
  })
  @JoinColumn({ name: 'org_id' })
  org_id: Organization;

  @OneToMany(() => Category, (subCategory) => subCategory.parent_id, {
    cascade: true,
    nullable: true,
  })
  sub_categories: Category[];

  @ManyToOne(() => Category, (category) => category.sub_categories, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent_id: Category;

  @OneToMany(() => Model, (model) => model.category_id, { cascade: true })
  models: Model[];
}
