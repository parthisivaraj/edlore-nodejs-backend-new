import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { DBSchemas } from '@app/schema';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [DBSchemas.user],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
