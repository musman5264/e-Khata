import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { tenantContext } from '../middleware/tenant';
import { UserRole } from '../models/User';

const router = Router();

// Apply middleware
router.use(tenantContext);
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.getAllUsers);

// Get user by ID
router.get('/:id', UserController.getUserById);

// Create user (Admin only)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^03\d{9}$/),
    body('password').isLength({ min: 8 }),
    body('role').isIn(Object.values(UserRole))
  ],
  UserController.createUser
);

// Update user
router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().matches(/^03\d{9}$/)
  ],
  UserController.updateUser
);

// Delete user (Admin only)
router.delete('/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.deleteUser);

// Update notification settings
router.put('/:id/notification-settings', UserController.updateNotificationSettings);

export default router;
