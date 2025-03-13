import { Entity, Column } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('tablet_versions')
export class TabletVersions extends BaseEntityWithoutDelete {
  @Column()
  android_app_url: string;
  @Column()
  android_version: string;

  @Column()
  android_version_code: string;

  @Column()
  ios_app_url: string;

  @Column()
  ios_version: string;

  @Column()
  ios_version_code: string;
}
