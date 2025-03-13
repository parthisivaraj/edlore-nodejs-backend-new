import { Entity, Column, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('organizations')
export class Organization extends BaseEntityWithoutDelete {
  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', nullable: true })
  mobile_number?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  line1?: string;

  @Column({ type: 'varchar', nullable: true })
  line2?: string;

  @Column({ type: 'varchar', nullable: true })
  city?: string;

  @Column({ type: 'varchar', nullable: true })
  state?: string;

  @Column({ type: 'varchar', nullable: true })
  country?: string;

  @Column({ type: 'varchar', nullable: true })
  zip_code?: string;

  @OneToMany(() => User, (user) => user.organization, { cascade: true })
  users: User[];

  @OneToMany(() => Category, (category) => category.org_id, {
    cascade: true,
  })
  categories: Category[];

  // // Assuming Media and Logo are handled differently in your setup
  // @OneToMany(() => Media, media => media.organization, { cascade: true })
  // medias: Media[];

  // @OneToOne(() => Logo, { nullable: true })
  // @JoinColumn()
  // logo: Logo;
}
