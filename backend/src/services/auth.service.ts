import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import User, { IUser } from '../models/User';
import Session from '../models/Session';
import logger from '../utils/logger';
import { sendOTP, verifyOTP } from './firebase.service';

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

export class AuthService {
  static generateToken(userId: string, tenantId: string, sessionId: string): string {
    return jwt.sign(
      { id: userId, tenantId, sessionId },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static async createSession(
    userId: string,
    tenantId: string,
    deviceInfo: DeviceInfo
  ): Promise<{ sessionToken: string; refreshToken: string; sessionId: string }> {
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const session = await Session.create({
      userId,
      tenantId,
      sessionToken: crypto.randomBytes(32).toString('hex'),
      refreshToken,
      deviceInfo,
      expiresAt
    });

    const sessionToken = this.generateToken(userId, tenantId, session._id.toString());

    return {
      sessionToken,
      refreshToken,
      sessionId: session._id.toString()
    };
  }

  static async login(
    email: string,
    password: string,
    tenantId: string,
    deviceInfo: DeviceInfo
  ): Promise<LoginResponse> {
    try {
      // Find user
      const user = await User.findOne({ email, tenantId, isActive: true }).select('+password');

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Update last login and device info
      user.lastLogin = new Date();
      user.deviceInfo = {
        lastDeviceId: deviceInfo.deviceId,
        lastDeviceType: deviceInfo.deviceType,
        lastDeviceName: deviceInfo.deviceName,
        lastIpAddress: deviceInfo.ipAddress
      };
      await user.save();

      // Create session
      const { sessionToken, refreshToken } = await this.createSession(
        user._id.toString(),
        tenantId,
        deviceInfo
      );

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      logger.info(`User logged in: ${user.email}`);

      return {
        success: true,
        token: sessionToken,
        refreshToken,
        user: userObj
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  static async logout(sessionId: string): Promise<boolean> {
    try {
      await Session.findByIdAndUpdate(sessionId, { isActive: false });
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      return false;
    }
  }

  static async sendPhoneOTP(phone: string): Promise<boolean> {
    try {
      return await sendOTP(phone);
    } catch (error) {
      logger.error('Send OTP error:', error);
      return false;
    }
  }

  static async verifyPhoneOTP(userId: string, otp: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      const isValid = await verifyOTP(user.phone, otp);
      
      if (isValid) {
        user.isPhoneVerified = true;
        await user.save();
      }

      return isValid;
    } catch (error) {
      logger.error('Verify OTP error:', error);
      return false;
    }
  }

  static async refreshToken(refreshToken: string, deviceInfo: DeviceInfo): Promise<LoginResponse> {
    try {
      const session = await Session.findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      const user = await User.findById(session.userId);
      
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new tokens
      const newSessionToken = this.generateToken(
        user._id.toString(),
        session.tenantId.toString(),
        session._id.toString()
      );

      // Update session
      session.lastActivity = new Date();
      session.deviceInfo = deviceInfo;
      await session.save();

      const userObj = user.toObject();
      
      return {
        success: true,
        token: newSessionToken,
        refreshToken,
        user: userObj
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }
}
