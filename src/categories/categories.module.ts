import { Module } from '@nestjs/common';
import { DBSchemas } from '@app/schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.category,
    DBSchemas.model,
    DBSchemas.device,
    DBSchemas.organization,
    MediaModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
