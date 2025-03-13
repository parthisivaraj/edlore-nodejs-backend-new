import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ActiveStorageBlob } from './active-storage-blobs.entity';
import { AttachedMedia } from './attached-media.entity';
import { Device } from './devices.entity';
import { User } from './user.entity';

@Entity('active_storage_attachments')
export class ActiveStorageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  record_type: string;

  @Column()
  record_id: string;

  @Column()
  blob_id: string;

  @OneToOne(() => ActiveStorageBlob, { eager: true })
  @JoinColumn({ name: 'blob_id' })
  blob: ActiveStorageBlob;

  @Column({ type: 'timestamp' })
  created_at: Date;

  @OneToOne(
    () => AttachedMedia,
    (attachedMedia) => attachedMedia.active_storage_attachment_id,
  )
  attached_media: AttachedMedia;

  @ManyToOne(() => Device, (device) => device.attachedMedia)
  @JoinColumn({ name: 'record_id' })
  device: Device;

  @ManyToOne(() => User, (user) => user.attachedMedia)
  @JoinColumn({ name: 'record_id' })
  user: User;
}
