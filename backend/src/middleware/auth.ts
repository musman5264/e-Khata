import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import User, { IUser } from '../models/User';
import Session from '../models/Session';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
  tenantId?: string;
  sessionId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        tenantId: string;
        sessionId: string;
      };

      // Check if session is valid
      const session = await Session.findOne({
        _id: decoded.sessionId,
        userId: decoded.id,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        res.status(401).json({
          success: false,
          message: 'Session expired or invalid'
        });
        return;
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      // Get user
      const user = await User.findById(decoded.id).select('+password');

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
        return;
      }

      req.user = user;
      req.tenantId = decoded.tenantId;
      req.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
      return;
    }

    next();
  };
};
