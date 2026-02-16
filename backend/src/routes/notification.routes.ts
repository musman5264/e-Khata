import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { tenantContext } from '../middleware/tenant';

const router = Router();

// Apply middleware
router.use(tenantContext);
router.use(authenticate);

// Get all notifications
router.get('/', NotificationController.getAllNotifications);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

export default router;
