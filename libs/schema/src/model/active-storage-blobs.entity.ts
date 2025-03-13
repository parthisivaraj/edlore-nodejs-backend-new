import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('active_storage_blobs')
export class ActiveStorageBlob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column()
  service_name: 'local' | 'amazon';

  @Column()
  filename: string;

  @Column()
  byte_size: number;

  @Column()
  checksum: string;

  @Column()
  content_type: string;

  @Column()
  file_type: string;

  @Column()
  title: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column({ type: 'timestamp' })
  created_at: Date;
}
