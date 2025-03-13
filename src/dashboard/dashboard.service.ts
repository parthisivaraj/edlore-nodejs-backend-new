import { ActiveStorageBlob, Device, Group, Organization } from '@app/schema';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(ActiveStorageBlob)
    private readonly mediaRepository: Repository<ActiveStorageBlob>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async get() {
    const [
      organizations,
      totalGroups,
      activeGroupCount,
      inactiveGroupCount,
      totalDevices,
      activeDeviceCount,
      draftDeviceCount,
      modelCount,
      imageCount,
      videoCount,
      audioCount,
      documentCount,
      zipCount,
      otherMediaCount,
    ] = await Promise.all([
      this.organizationRepository.find({
        relations: ['users'],
      }),
      this.groupRepository.count({ where: { is_deleted: false } }),
      this.groupRepository.count({ where: { is_deleted: false, status: 1 } }),
      this.groupRepository.count({ where: { is_deleted: false, status: 2 } }),
      this.deviceRepository.count({ where: { is_deleted: false } }),
      this.deviceRepository.count({ where: { is_deleted: false, status: 2 } }),
      this.deviceRepository.count({ where: { is_deleted: false, status: 1 } }),
      this.deviceRepository.count({ where: { is_deleted: false } }), // Adjust based on your Model entity
      this.mediaRepository.count({
        where: { file_type: 'image' },
      }),
      this.mediaRepository.count({
        where: { file_type: 'video' },
      }),
      this.mediaRepository.count({
        where: { file_type: 'audio' },
      }),
      this.mediaRepository.count({
        where: { file_type: In(['pdf', 'txt', 'csv']) },
      }),
      this.mediaRepository.count({
        where: { file_type: '3d-zip' },
      }),
      this.mediaRepository.count({
        where: { file_type: 'other' },
      }),
    ]);
    const organization = organizations[0];
    // Calculate user stats
    const totalUsers = organization?.users.length || 0;
    const activeUsers =
      organization?.users.filter((user) => user.status === 1).length || 0;
    const inactiveUsersCount =
      organization?.users.filter((user) => user.status === 2).length || 0;
    const activePercent = totalUsers
      ? ((activeUsers * 100) / totalUsers).toFixed(2)
      : 0;
    const inactivePercent = totalUsers
      ? (100 - Number(activePercent)).toFixed(2)
      : 0;

    // Calculate group percentages
    const activeGroupPercent = totalGroups
      ? ((activeGroupCount * 100) / totalGroups).toFixed(2)
      : 0;
    const inactiveGroupPercent = totalGroups
      ? (100 - Number(activeGroupPercent)).toFixed(2)
      : 0;

    return {
      work_order_status: {
        pending: 0,
        overdues: 0,
        six_month: 0,
        weekly: 0,
      },
      users: {
        active_users_count: activeUsers,
        inactive_users_count: inactiveUsersCount,
        active_users_percent: activePercent,
        inactive_users_percent: inactivePercent,
        total_users: totalUsers,
      },
      groups: {
        active_groups_count: activeGroupCount,
        inactive_groups_count: inactiveGroupCount,
        active_groups_percent: activeGroupPercent,
        inactive_groups_percent: inactiveGroupPercent,
        total_groups: totalGroups,
      },
      devices: {
        total_devices: totalDevices,
        active_devices: activeDeviceCount,
        draft_devices: draftDeviceCount,
      },
      models: modelCount,
      system_overview: {
        image: imageCount,
        video: videoCount,
        audio: audioCount,
        document: documentCount,
        zip: zipCount,
        others: otherMediaCount,
      },
    };
  }
}
