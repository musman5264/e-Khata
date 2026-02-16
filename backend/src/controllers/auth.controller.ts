import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { DeviceRequest } from '../middleware/deviceInfo';
import { AuthService } from '../services/auth.service';
import User from '../models/User';
import { createAuditLog } from '../middleware/audit';
import { LogCategory } from '../models/AuditLog';
import logger from '../utils/logger';

type CombinedRequest = AuthRequest & DeviceRequest;

export class AuthController {
  static async register(req: CombinedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { name, email, phone, password, role } = req.body;
      const tenantId = req.tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        tenantId, 
        $or: [{ email }, { phone }]
      });

      if (existingUser) {
        res.status(400).json({ 
          success: false, 
          message: 'User with this email or phone already exists' 
        });
        return;
      }

      // Create user
      const user = await User.create({
        tenantId,
        name,
        email,
        phone,
        password,
        role: role || 'user'
      });

      await createAuditLog(req, LogCategory.AUTH, 'user_registered', { userId: user._id });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }

  static async login(req: CombinedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, password } = req.body;
      const tenantId = req.tenantId;

      if (!tenantId || !req.deviceInfo) {
        res.status(400).json({ success: false, message: 'Required information missing' });
        return;
      }

      const result = await AuthService.login(email, password, tenantId, req.deviceInfo);

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      await createAuditLog(req, LogCategory.AUTH, 'user_login', { userId: result.user?.id });

      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.sessionId) {
        res.status(400).json({ success: false, message: 'Session ID required' });
        return;
      }

      await AuthService.logout(req.sessionId);
      await createAuditLog(req, LogCategory.AUTH, 'user_logout', { userId: req.user?._id });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  }

  static async refreshToken(req: CombinedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken || !req.deviceInfo) {
        res.status(400).json({ success: false, message: 'Refresh token and device info required' });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken, req.deviceInfo);

      res.json(result);
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({ success: false, message: 'Token refresh failed' });
    }
  }

  static async sendOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { phone } = req.body;
      const success = await AuthService.sendPhoneOTP(phone);

      if (success) {
        res.json({ success: true, message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
      }
    } catch (error) {
      logger.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  }

  static async verifyOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { otp } = req.body;
      const userId = req.user?._id.toString();

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const success = await AuthService.verifyPhoneOTP(userId, otp);

      if (success) {
        await createAuditLog(req, LogCategory.AUTH, 'phone_verified', { userId });
        res.json({ success: true, message: 'Phone verified successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const user = await User.findById(req.user._id).select('-password');

      res.json({ success: true, user });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({ success: false, message: 'Failed to get user' });
    }
  }
}
