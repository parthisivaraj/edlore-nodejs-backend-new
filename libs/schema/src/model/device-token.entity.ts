import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('device_tokens')
export class DeviceToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.device_tokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  device_token: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;
}
