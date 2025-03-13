import { Notification } from '@app/schema';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async get(userId: string, readFlag?: boolean): Promise<Notification[]> {
    try {
      const query = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.user_id = :userId', { userId });
      if (readFlag !== undefined) {
        query.andWhere('notification.read_flag = :readFlag', { readFlag });
      }

      return await query.getMany();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Could not fetch notifications');
    }
  }
  create(data) {
    console.log(data);
    return data;
  }

  async unreadCount() {
    const unreadCount = await this.notificationRepository.count({
      where: { read_flag: false, is_deleted: false },
    });
    const permissionsUpdatedAt = new Date('2024-03-28T05:37:54.773-07:00');
    const profileUpdatedAt = new Date('2024-11-26T22:50:35.958-08:00');
    const passwordUpdatedAt = new Date('2024-11-26T22:03:15.358-08:00');

    return {
      unread: unreadCount,
      permissions_updated_at: permissionsUpdatedAt.toISOString(),
      profile_updated_at: profileUpdatedAt.toISOString(),
      password_updated_at: passwordUpdatedAt.toISOString(),
    };
  }

  async clearNotification(clearType: string, userId: string) {
    try {
      if (clearType === 'all') {
        await this.notificationRepository.update(
          { user_id: userId, is_deleted: false },
          { read_flag: true },
        );
      } else if (clearType === 'unread') {
        await this.notificationRepository.update(
          { user_id: userId, read_flag: false, is_deleted: false },
          { read_flag: true },
        );
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      throw new Error('Error clearing notifications');
    }
  }
}
