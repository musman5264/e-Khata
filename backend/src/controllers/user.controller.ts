import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { createAuditLog } from '../middleware/audit';
import { LogCategory } from '../models/AuditLog';
import logger from '../utils/logger';

export class UserController {
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 20 } = req.query;

      const users = await User.find({ tenantId, isActive: true })
        .select('-password')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments({ tenantId, isActive: true });

      res.json({
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({ success: false, message: 'Failed to get users' });
    }
  }

  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findOne({ _id: id, tenantId }).select('-password');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, user });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to get user' });
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { name, email, phone, password, role } = req.body;
      const tenantId = req.tenantId;

      const user = await User.create({
        tenantId,
        name,
        email,
        phone,
        password,
        role
      });

      await createAuditLog(req, LogCategory.USER, 'user_created', { userId: user._id });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: { ...user.toObject(), password: undefined }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const tenantId = req.tenantId;
      const updates = req.body;

      const user = await User.findOneAndUpdate(
        { _id: id, tenantId },
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await createAuditLog(req, LogCategory.USER, 'user_updated', { userId: id });

      res.json({ success: true, message: 'User updated successfully', user });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findOneAndUpdate(
        { _id: id, tenantId },
        { isActive: false },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await createAuditLog(req, LogCategory.USER, 'user_deleted', { userId: id });

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }

  static async updateNotificationSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { email, push, sms } = req.body;

      const user = await User.findOneAndUpdate(
        { _id: id, tenantId },
        { 
          notificationSettings: {
            email: email !== undefined ? email : true,
            push: push !== undefined ? push : true,
            sms: sms !== undefined ? sms : false
          }
        },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Notification settings updated successfully',
        notificationSettings: user.notificationSettings
      });
    } catch (error) {
      logger.error('Update notification settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }
}
