import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('otps')
export class OTP extends BaseEntity {
  @ManyToOne(() => User, (user) => user.otps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  created_at: Date;

  @Column()
  otp: string;

  @Column()
  verification_type: string;

  @Column()
  token: string;

  @Column()
  verified_at: Date;
}
