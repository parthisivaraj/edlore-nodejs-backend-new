import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationsController {
  constructor(private notesService: NotificationsService) {}

  @Get('unread_count')
  async unreadCount() {
    return await this.notesService.unreadCount();
  }

  @Get(':userId')
  async get(
    @Param('userId') userId: string,
    @Query('read_flag') readFlag: boolean,
  ) {
    return await this.notesService.get(userId, readFlag);
  }

  @Post('')
  async create(@Body() data) {
    return await this.notesService.create(data);
  }

  @Post('clear_notification')
  async remove(@Body() data: { clear_type: string; user_id: string }) {
    return await this.notesService.clearNotification(
      data.clear_type,
      data.user_id,
    );
  }
}
