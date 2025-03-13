import { TabletVersions } from '@app/schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TabletVersionsService {
  constructor(
    @InjectRepository(TabletVersions)
    private readonly tabletVersionsRepository: Repository<TabletVersions>,
  ) {}

  async get() {
    const tablet_versions = await this.tabletVersionsRepository.find();
    return {
      message: 'Success',
      tablet_version: tablet_versions.length ? tablet_versions[0] : null,
    };
  }

  async create(data: TabletVersions) {
    const tablet_version = await this.tabletVersionsRepository.create(data);
    await this.tabletVersionsRepository.save(tablet_version);
    return await this.get();
  }

  async update(id: string, data: TabletVersions) {
    const tabletVersion = await this.tabletVersionsRepository.findOne({
      where: { id },
    });

    if (!tabletVersion) {
      throw new NotFoundException(`Tablet Versions with id ${id} not found`);
    }

    Object.assign(tabletVersion, {
      ...data,
    });
    await this.tabletVersionsRepository.save(tabletVersion);
    return await this.get();
  }
}
