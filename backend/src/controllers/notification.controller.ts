import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification, { NotificationStatus } from '../models/Notification';
import { NotificationService } from '../services/notification.service';
import logger from '../utils/logger';

export class NotificationController {
  static async getAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { page = 1, limit = 20 } = req.query;

      const notifications = await Notification.find({ userId })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });

      const total = await Notification.countDocuments({ userId });
      const unread = await Notification.countDocuments({ userId, status: NotificationStatus.PENDING });

      res.json({
        success: true,
        notifications,
        unread,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get all notifications error:', error);
      res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const notification = await Notification.findOne({ _id: id, userId });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      await NotificationService.markAsRead(id);

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      logger.error('Mark as read error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      await Notification.updateMany(
        { userId, status: NotificationStatus.PENDING },
        { status: NotificationStatus.READ, readAt: new Date() }
      );

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      logger.error('Mark all as read error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }
}
