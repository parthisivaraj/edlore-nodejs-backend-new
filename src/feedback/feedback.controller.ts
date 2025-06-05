import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FeedbackDTO } from './dto/feedback';
import { DeviceToken } from '@app/schema';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@ApiTags('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body() body: FeedbackDTO,
    @Request() req,
  ): Promise<DeviceToken> {
    return this.feedbackService.sendMail(body, req.user);
  }
}
