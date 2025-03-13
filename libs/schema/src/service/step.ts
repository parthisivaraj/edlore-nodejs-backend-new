import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AttachedMediasAttribute, StepsAttribute } from '../dto';
import {
  ApprovalStatus,
  AttachedMedia,
  Step,
  TroubleshootStep,
} from '../model';

@Injectable()
export class CommonStepService {
  constructor() {}

  async saveAttachedMedia(
    queryRunner: QueryRunner,
    medias: AttachedMediasAttribute[],
    step_id: string,
    type: string,
    file_type?: string,
  ) {
    const tempMedia = medias || [];
    for (const mediaDto of tempMedia) {
      if (mediaDto._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.delete(AttachedMedia, { id: mediaDto.id });
      } else {
        // Update or add new steps
        const attached_media = queryRunner.manager.create(AttachedMedia, {
          active_storage_attachment_id:
            mediaDto.active_storage_attachment_id as any,
          mediable_type: type,
          mediable_id: step_id,
          file_type: file_type || null,
        });

        await queryRunner.manager.save(AttachedMedia, attached_media);
      }
    }
  }

  async saveSteps(
    queryRunner: QueryRunner,
    steps: StepsAttribute[],
    id: string,
    type: string,
  ) {
    const tempSteps = steps || [];
    for (const stepDto of tempSteps) {
      if (stepDto._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.update(
          Step,
          { id: stepDto.id },
          { is_deleted: true },
        );
      } else {
        // Update or add new steps
        const step = stepDto.id
          ? await queryRunner.manager.findOne(Step, {
              where: { id: stepDto.id },
            })
          : queryRunner.manager.create(Step, {
              stepable_id: id,
              stepable_type: type,
              parameters: { skip: false },
            });

        Object.assign(step, {
          title: stepDto.title,
          step_order: stepDto.step_order,
          description: stepDto.description,
        });
        await queryRunner.manager.save(Step, step);

        await this.saveAttachedMedia(
          queryRunner,
          stepDto.attached_medias_attributes,
          stepDto.id,
          'Step',
        );
      }
    }
  }

  async saveTroubleSteps(
    queryRunner: QueryRunner,
    steps: StepsAttribute[],
    id: string,
  ) {
    const tempSteps = steps || [];
    for (const stepDto of tempSteps) {
      if (stepDto._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.update(
          TroubleshootStep,
          { id: stepDto.id },
          { is_deleted: true },
        );
      } else {
        // Update or add new steps
        const step = stepDto.id
          ? await queryRunner.manager.findOne(TroubleshootStep, {
              where: { id: stepDto.id },
            })
          : queryRunner.manager.create(TroubleshootStep, {
              troubleshoot_id: {
                id: id,
              },
              user_id: '2cb52ed3-2e90-4336-b534-3af409f59c2e', //TODO
              approvalStatus: ApprovalStatus.approved,
              created_at: new Date(),
              updated_at: new Date(),
              is_deleted: false,
            });

        Object.assign(step, {
          title: stepDto.title,
          step_order: stepDto.step_order,
          description: stepDto.description,
        });
        await queryRunner.manager.save(TroubleshootStep, step);

        if ((stepDto.attached_medias_attributes || []).length > 0) {
          await this.saveAttachedMedia(
            queryRunner,
            stepDto.attached_medias_attributes,
            stepDto.id,
            'TroubleshootStep',
          );
        }
      }
    }
  }
}
