import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Register FCM device token' })
  async registerToken(@Body() dto: RegisterTokenDto, @Request() req) {
    await this.notificationsService.registerDeviceToken(req.user.userId, dto.fcmToken);
    return { message: 'Token registered successfully' };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification to user' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    await this.notificationsService.sendNotification(dto.userId, dto.title, dto.body, dto.data);
    return { message: 'Notification sent successfully' };
  }
}
