import { Request, Response, NextFunction } from 'express';
import DeviceDetector from 'device-detector-js';
import logger from '../utils/logger';

export interface DeviceRequest extends Request {
  deviceInfo?: {
    deviceId: string;
    deviceType: string;
    deviceName: string;
    ipAddress: string;
    userAgent: string;
  };
}

const deviceDetector = new DeviceDetector();

export const captureDeviceInfo = (
  req: DeviceRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceId = req.headers['x-device-id'] as string || 'unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

    const device = deviceDetector.parse(userAgent);

    const deviceType = device.device?.type || 'desktop';
    const deviceName = device.device?.brand 
      ? `${device.device.brand} ${device.device.model || ''}`.trim()
      : device.os?.name || 'Unknown Device';

    req.deviceInfo = {
      deviceId,
      deviceType,
      deviceName,
      ipAddress,
      userAgent
    };

    logger.debug('Device info captured:', req.deviceInfo);

    next();
  } catch (error) {
    logger.error('Device info capture error:', error);
    // Continue even if device detection fails
    req.deviceInfo = {
      deviceId: 'unknown',
      deviceType: 'unknown',
      deviceName: 'Unknown',
      ipAddress: req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    };
    next();
  }
};
