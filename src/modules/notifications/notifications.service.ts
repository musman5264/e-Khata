import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { LoggingService } from '../logging/logging.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private firebaseApp: admin.app.App;

  constructor(
    private loggingService: LoggingService,
    private usersService: UsersService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase credentials are available
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
      ) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        this.loggingService.log('Firebase initialized successfully');
      } else {
        this.loggingService.warn('Firebase credentials not configured');
      }
    } catch (error) {
      this.loggingService.error('Failed to initialize Firebase', error.stack);
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      
      if (!user.fcmToken) {
        this.loggingService.warn(`No FCM token for user ${userId}`);
        return;
      }

      if (!this.firebaseApp) {
        this.loggingService.warn('Firebase not initialized, skipping notification');
        return;
      }

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: user.fcmToken,
      };

      const response = await admin.messaging().send(message);
      
      this.loggingService.log('Notification sent successfully', {
        userId,
        messageId: response,
      });
    } catch (error) {
      this.loggingService.error(
        'Failed to send notification',
        error.stack,
        'NotificationsService',
      );
    }
  }

  async sendTransactionNotification(
    userId: string,
    transactionType: string,
    amount: number,
    customerName: string,
  ): Promise<void> {
    const title = 'New Transaction';
    const body = `${transactionType} of Rs.${amount} for ${customerName}`;
    await this.sendNotification(userId, title, body, {
      type: 'transaction',
      transactionType,
      amount: amount.toString(),
    });
  }

  async sendPaymentNotification(
    userId: string,
    amount: number,
    status: string,
  ): Promise<void> {
    const title = 'Payment Update';
    const body = `Payment of Rs.${amount} is ${status}`;
    await this.sendNotification(userId, title, body, {
      type: 'payment',
      amount: amount.toString(),
      status,
    });
  }

  async registerDeviceToken(userId: string, fcmToken: string): Promise<void> {
    await this.usersService.updateFcmToken(userId, fcmToken);
    this.loggingService.log('Device token registered', { userId });
  }
}
