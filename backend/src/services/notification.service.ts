import Notification, { NotificationType, NotificationStatus } from '../models/Notification';
import { sendPushNotification } from './firebase.service';
import logger from '../utils/logger';

export interface NotificationData {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

export class NotificationService {
  static async createNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      const notification = await Notification.create({
        ...notificationData,
        status: NotificationStatus.PENDING
      });

      // Send notifications based on channels
      await this.sendNotification(notification);

      return true;
    } catch (error) {
      logger.error('Create notification error:', error);
      return false;
    }
  }

  private static async sendNotification(notification: any): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      // Send push notification
      if (notification.channels?.push) {
        promises.push(this.sendPush(notification));
      }

      // Send email notification
      if (notification.channels?.email) {
        promises.push(this.sendEmail(notification));
      }

      // Send SMS notification
      if (notification.channels?.sms) {
        promises.push(this.sendSMS(notification));
      }

      await Promise.allSettled(promises);

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notification.save();
    } catch (error) {
      logger.error('Send notification error:', error);
      notification.status = NotificationStatus.FAILED;
      await notification.save();
    }
  }

  private static async sendPush(notification: any): Promise<boolean> {
    try {
      // In production, you would get the user's FCM token and send push notification
      logger.info(`Sending push notification to user: ${notification.userId}`);
      
      // TODO: Get user's FCM token from database
      // const userToken = await this.getUserFCMToken(notification.userId);
      // await sendPushNotification(userToken, notification.title, notification.message, notification.data);

      return true;
    } catch (error) {
      logger.error('Push notification error:', error);
      return false;
    }
  }

  private static async sendEmail(notification: any): Promise<boolean> {
    try {
      // In production, you would integrate with an email service
      logger.info(`Sending email notification to user: ${notification.userId}`);
      
      // TODO: Implement email sending using services like SendGrid, AWS SES, etc.

      return true;
    } catch (error) {
      logger.error('Email notification error:', error);
      return false;
    }
  }

  private static async sendSMS(notification: any): Promise<boolean> {
    try {
      // In production, you would integrate with an SMS service
      logger.info(`Sending SMS notification to user: ${notification.userId}`);
      
      // TODO: Implement SMS sending using services like Twilio, etc.

      return true;
    } catch (error) {
      logger.error('SMS notification error:', error);
      return false;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await Notification.findByIdAndUpdate(notificationId, {
        status: NotificationStatus.READ,
        readAt: new Date()
      });
      return true;
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      return false;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Get user notifications error:', error);
      return [];
    }
  }
}
