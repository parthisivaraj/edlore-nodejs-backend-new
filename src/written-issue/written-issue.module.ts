import { Module } from '@nestjs/common';
import { WrittenIssueService } from './written-issue.service';
import { DBSchemas } from '@app/schema';
import { WrittenIssueController } from './written-issue.controller';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.writtenIssue, DBSchemas.section, MediaModule],
  controllers: [WrittenIssueController],
  providers: [WrittenIssueService],
})
export class WrittenIssueModule {}
