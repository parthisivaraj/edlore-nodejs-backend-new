import { Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.model, DBSchemas.category, DBSchemas.device, MediaModule],
  controllers: [ModelController],
  providers: [ModelService],
})
export class ModelModule {}
