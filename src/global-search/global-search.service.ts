import { ActiveStatus, Anaglyph, Device, Model, Part, Section, User } from '@app/schema';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalSearchParams } from './dto/search';
import { UserResponseDto } from 'src/users/dto/user';
import { DateUtilsService } from '@app/common-utils';

@Injectable()
export class GlobalSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,

    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,

    @InjectRepository(Anaglyph)
    private readonly anaglyphRepository: Repository<Anaglyph>,

    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}

  private convertToUserDTO(user: User): UserResponseDto {
    const response = new UserResponseDto();
    response.id = user.id;
    response.full_name = `${user.first_name} ${user.last_name}`;
    response.email = user.email;
    response.mobile_number = user.mobile_number;
    response.created_at = DateUtilsService.dateToString(user.created_at);
    response.first_name = user.first_name;
    response.last_name = user.last_name;
    response.user_id = user.user_id;
    response.image = '';
    response.identification_code = user.identification_code || '';
    response.status = user.status === 1 ? 'active' : 'inactive';
    return response;
  }

  async get(params: GlobalSearchParams) {
    const result = {
      users: [],
      devices: [],
      models: [],
      sections: [],
      anaglyphs: [],
      parts: [],
      work_orders: [],
    };
  
    // User retrieval
    if (params.type === 'all' || params.type === 'user') {
      let userQueryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: ActiveStatus.Active });
  
      if (params.search) {
        const escapedKeyword = params.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        userQueryBuilder = userQueryBuilder.andWhere(
          'LOWER("user".first_name) LIKE LOWER(:search) OR LOWER("user".last_name) LIKE LOWER(:search)',
          { search: `%${escapedKeyword}%` },
        );
      }
      const users = await userQueryBuilder.getMany();
      result.users = users.map((user) => this.convertToUserDTO(user));
    }
  
    // Model retrieval
    if (params.type === 'all' || params.type === 'model') {
      let modelQueryBuilder = this.modelRepository
        .createQueryBuilder('model')
        .where({
          is_deleted: false,
        });
  
      if (params.search) {
        const escapedKeyword = params.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        modelQueryBuilder = modelQueryBuilder.andWhere(
          "(LOWER(model.title) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(model.model_id) LIKE LOWER(:search) ESCAPE '\\')",
          { search: `%${escapedKeyword}%` },
        );
      }
      result.models = await modelQueryBuilder.getMany();
    }
  
    // Device retrieval
    if (params.type === 'all' || params.type === 'device') {
      let deviceQueryBuilder = this.deviceRepository
        .createQueryBuilder('device')
        .where({
          is_deleted: false,
        });
  
      if (params.search) {
        const escapedKeyword = params.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        deviceQueryBuilder = deviceQueryBuilder.andWhere(
          "(LOWER(device.name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(device.device_id) LIKE LOWER(:search) ESCAPE '\\')",
          { search: `%${escapedKeyword}%` },
        );
      }
      result.devices = await deviceQueryBuilder.getMany();
    }
  
    // Anaglyph retrieval
    if (params.type === 'all' || params.type === 'section') {
      let anaglyphQueryBuilder = this.anaglyphRepository
        .createQueryBuilder('anaglyph')
        .leftJoinAndSelect('anaglyph.model', 'model')
        .where('anaglyph.is_deleted = :isDeleted', { isDeleted: false });
  
      if (params.search) {
        const escapedKeyword = params.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        anaglyphQueryBuilder = anaglyphQueryBuilder.andWhere(
          "(LOWER(anaglyph.title) LIKE LOWER(:search))",
          { search: `%${escapedKeyword}%` },
        );
      }
  
      result.anaglyphs = await anaglyphQueryBuilder.getMany();
    }

    // Parts retrieval
    if (params.type === 'all' || params.type === 'part') {
      let sectionQueryBuilder = this.partRepository
        .createQueryBuilder('part')
        .leftJoinAndSelect('part.anaglyph', 'anaglyph')
        .leftJoinAndSelect('anaglyph.model', 'model')
        .where('part.is_deleted = :isDeleted', { isDeleted: false });
  
      if (params.search) {
        const escapedKeyword = params.search.replace(
          /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
          '\\$&',
        );
        sectionQueryBuilder = sectionQueryBuilder.andWhere(
          "(LOWER(part.part_name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(part.part_id) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(part.nsn_number) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(part.manufacturer_code) LIKE LOWER(:search) ESCAPE '\\')",
          { search: `%${escapedKeyword}%` },
        );
      }
  
      result.parts = await sectionQueryBuilder.getMany();
    }
  
    return result;
  }
  
}
