import { Request, Response, NextFunction } from 'express';
import AuditLog, { LogLevel, LogCategory } from '../models/AuditLog';
import logger from '../utils/logger';

export interface AuditRequest extends Request {
  user?: any;
  tenantId?: string;
  deviceInfo?: any;
}

export const createAuditLog = async (
  req: AuditRequest,
  category: LogCategory,
  action: string,
  details: any = {},
  level: LogLevel = LogLevel.INFO
): Promise<void> => {
  try {
    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      level,
      category,
      action,
      details,
      ipAddress: req.deviceInfo?.ipAddress || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    logger.error('Audit log creation error:', error);
    // Don't throw error, just log it
  }
};

export const auditMiddleware = (category: LogCategory, action: string) => {
  return async (req: AuditRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any): Response {
      // Create audit log after response is sent
      setImmediate(async () => {
        try {
          const level = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
          await createAuditLog(req, category, action, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            body: req.body
          }, level);
        } catch (error) {
          logger.error('Audit middleware error:', error);
        }
      });
      
      return originalJson(body);
    };
    
    next();
  };
};
