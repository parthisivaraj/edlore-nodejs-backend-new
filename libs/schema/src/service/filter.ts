import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../model/role.entity';
import { Section } from '../model/section.entity';
import { Model } from '../model/model.entity';
import { TaskType } from '../model/task-type.entity';
import { Permission } from '../model';

type type =
  | 'roles'
  | 'users_with_status'
  | 'users'
  | 'only_status'
  | 'devices_status'
  | 'all_devices'
  | 'devices'
  | 'sections_only'
  | 'safety_measures'
  | 'procedures'
  | 'medias'
  | 'work_orders';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    @InjectRepository(TaskType)
    private taskTypeRepository: Repository<TaskType>,
  ) {}

  // Main function to get filters dynamically
  async getFilters(
    selected_filters: any,
    model: type,
    modelId: string | null = null,
  ) {
    switch (model) {
      case 'roles':
        return {
          applicable_filters: this.getRolesFilters(),
          selected_filters,
        };

      case 'users_with_status':
        const allUserFiles = await this.getUsersFilters();

        return {
          applicable_filters: [...allUserFiles, this.getStatusFilters()],
          selected_filters,
        };

      case 'users':
        const allUsers = await this.getUsersFilters();

        return {
          applicable_filters: allUsers,
          selected_filters,
        };

      case 'only_status':
        return {
          applicable_filters: [this.getStatusFilters()],
          selected_filters,
        };

      case 'devices_status':
        return {
          applicable_filters: [this.getDeviceStatusFilters()],
          selected_filters,
        };

      case 'all_devices':
        const allDeviceModel = await this.getModelsFilters();
        return {
          applicable_filters: [allDeviceModel],
          selected_filters,
        };

      case 'devices':
        const deviceModel = await this.getDeviceFilters();
        return {
          applicable_filters: deviceModel,
          selected_filters,
        };

      case 'sections_only':
        const sectionOnly = await this.getSectionsFilters(modelId);

        return {
          applicable_filters: sectionOnly,
          selected_filters,
        };

      case 'safety_measures':
        return {
          applicable_filters: this.getSafetyMeasuresFilters(),
          selected_filters,
        };

      case 'procedures':
        const procedureModel = await this.getProcedureFilters();
        return {
          applicable_filters: procedureModel,
          selected_filters,
        };

      case 'medias':
        return {
          applicable_filters: this.getMediasFilters(),
          selected_filters,
        };

      case 'work_orders':
        return {
          applicable_filters: this.getWorkOrderFilters(),
          selected_filters,
        };

      default:
        return {};
    }
  }

  // Helper methods to generate filter options
  getWorkOrderFilters() {
    return [
      {
        name: 'Model ID',
        param: 'models',
        items: this.modelRepository
          .find()
          .then((models) =>
            models.map((model) => ({ id: model.id, title: model.model_id })),
          ),
      },
      {
        name: 'Task Type',
        param: 'task_types',
        items: this.taskTypeRepository
          .find()
          .then((types) =>
            types.map((type) => ({ id: type.id, title: type.title })),
          ),
      },
      {
        name: 'Assigned',
        param: 'assigned',
        items: [
          { id: 'Group', title: 'Group' },
          { id: 'User', title: 'User' },
        ],
      },
    ];
  }

  getMediasFilters() {
    return [
      {
        name: 'Media Type',
        param: 'media_type',
        items: [
          { id: 'video', title: 'Video' },
          { id: 'image', title: 'Image' },
          { id: 'pdf', title: 'PDF' },
          { id: 'txt', title: 'TXT' },
          { id: 'audio', title: 'Audio' },
          { id: '3d-zip', title: '3D/ZIP' },
          { id: 'csv', title: 'CSV' },
          { id: 'other', title: 'Other' },
        ],
      },
    ];
  }

  getProceduresFilters() {
    return [this.getModelsFilters()];
  }

  getSafetyMeasuresFilters() {
    return [
      {
        name: 'Status',
        param: 'status',
        items: [
          { id: 1, title: 'Enabled' },
          { id: 2, title: 'Disabled' },
        ],
      },
    ];
  }

  async getSectionsFilters(modelId: string | null = null) {
    if (modelId === null) {
      return [
        {
          name: 'Sections',
          param: 'sections',
          items: await this.sectionRepository.find({
            where: { is_deleted: false },
            select: ['id', 'title', 'created_at'],
          }),
        },
      ];
    } else {
      return [
        {
          name: 'Sections',
          param: 'sections',
          items: await this.sectionRepository.find({
            where: { is_deleted: false, model_id: { id: modelId } },
            select: ['id', 'title', 'created_at'],
          }),
        },
      ];
    }
  }

  async getModelsFilters() {
    const items = await this.modelRepository.find({
      where: { is_deleted: false },
      select: ['id', 'title'],
    });
    return {
      name: 'Models',
      param: 'models',
      items: items.map((item) => ({ id: item.id, title: item.title })),
    };
  }

  async getProcedureFilters() {
    const model = await this.getModelsFilters();
    return [model];
  }

  async getDeviceFilters() {
    const model = await this.getModelsFilters();
    return [model, this.getDeviceStatusFilters()];
  }

  getDeviceStatusFilters() {
    return {
      name: 'Status',
      param: 'status',
      items: [
        { id: 1, title: 'Draft' },
        { id: 2, title: 'Active' },
      ],
    };
  }

  async getUsersFilters() {
    const items = await this.roleRepository.find({
      select: ['id', 'title', 'created_at'],
    });

    return [
      {
        name: 'User Roles',
        param: 'user_roles',
        items: items.map((item) => ({ id: item.id, title: item.title })),
      },
      {
        name: 'Availability status',
        param: 'avail_status',
        items: [
          { id: 1, title: 'Online' },
          { id: 2, title: 'Away' },
          { id: 3, title: 'Offline' },
          { id: 4, title: 'Busy' },
        ],
      },
    ];
  }

  async getRolesFilters() {
    const permissions = await this.permissionRepository.find({
      select: ['id', 'title', 'created_at'],
    });

    return [
      {
        name: 'Permissions',
        param: 'role_permissions',
        items: permissions,
      },
      this.getStatusFilters(),
    ];
  }

  getStatusFilters() {
    return {
      name: 'Status',
      param: 'status',
      items: [
        { id: 1, title: 'Active' },
        { id: 2, title: 'Inactive' },
      ],
    };
  }
}
