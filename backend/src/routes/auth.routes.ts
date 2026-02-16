import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { tenantContext } from '../middleware/tenant';
import { captureDeviceInfo } from '../middleware/deviceInfo';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply tenant context and device info to all routes
router.use(tenantContext);
router.use(captureDeviceInfo);

// Register
router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^03\d{9}$/),
    body('password').isLength({ min: 8 })
  ],
  AuthController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  AuthController.login
);

// Logout
router.post('/logout', authenticate, AuthController.logout);

// Refresh token
router.post('/refresh-token', captureDeviceInfo, AuthController.refreshToken);

// Send OTP
router.post(
  '/send-otp',
  [body('phone').matches(/^03\d{9}$/)],
  AuthController.sendOTP
);

// Verify OTP
router.post(
  '/verify-otp',
  authenticate,
  [body('otp').notEmpty()],
  AuthController.verifyOTP
);

// Get current user
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
