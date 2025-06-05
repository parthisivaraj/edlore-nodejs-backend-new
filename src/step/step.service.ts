import { Inject, Injectable } from '@nestjs/common';
import { Step } from '@app/schema';
import { Repository } from 'typeorm';
import { MediaService } from 'src/media/media.service';
import { AddStepDTO } from './dto/add-edit';
import { InjectRepository } from '@nestjs/typeorm';
import { AppConfigService } from '@app/config';

@Injectable()
export class StepService {
  constructor(
    @Inject()
    private mediaService: MediaService,

    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    private configService: AppConfigService,
  ) {}

  private async converToStepDTO(step: Step) {
    const temp = {
      id: step.id,
      title: step.title,
      description: step.description,
      step_order: step.step_order,
      parameters: {
        skip: false,
      },
      attached_medias: [],
    };
    temp.attached_medias = await Promise.all(
      step.attached_medias
        .filter((x) => x.active_storage_attachment_id)
        .map((attached_media) =>
          this.mediaService.convertAttachementDTO(attached_media),
        ),
    );
    return temp;
  }

  async create(data: AddStepDTO, files: any, org_id: string) {
    try {
      const step = this.stepRepository.create({
        stepable_id: data.stepable_id,
        stepable_type: data.stepable_type,
        parameters: { skip: false },
        description: data.description,
        step_order: +(data.step_order || 0),
        title: data.title,
      });
      await this.stepRepository.save(step);
      const machineInfo = this.configService.getMachineInfo();

      if (files && files['medias[]']) {
        const uploadedFiles = files['medias[]'] || [];

        for (let i = 0; i < uploadedFiles.length; i++) {
          const title = data.media[i].media_title;
          const mediaType = data.media[i].media_type;

          await this.mediaService.createMedia(
            uploadedFiles[i],
            {
              media_title: title,
              media_type: mediaType,
              mediable_id: step.id,
              mediable_type: 'Step',
            },
            org_id,
            machineInfo.mode === 'OFFLINE' ? 'local' : 'amazon',
          );
        }
      }

      const response = await this.stepRepository
        .createQueryBuilder('steps')
        .leftJoinAndSelect('steps.attached_medias', 'attached_medias')
        .leftJoinAndSelect(
          'attached_medias.active_storage_attachment_id',
          'active_storage_attachment_id',
        )
        .leftJoinAndSelect('active_storage_attachment_id.blob', 'blob')
        .where('steps.id = :id', { id: step.id })
        .getOne();

      const result = await this.converToStepDTO(response);
      return { step: result };
    } catch (error) {
      throw error;
    }
  }
}
