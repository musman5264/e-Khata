import { Request, Response, NextFunction } from 'express';
import Tenant from '../models/Tenant';
import logger from '../utils/logger';

export interface TenantRequest extends Request {
  tenant?: any;
  tenantId?: string;
}

export const tenantContext = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get tenant from subdomain or header
    let tenantIdentifier: string | undefined;

    // Check for tenant header (useful for API calls)
    if (req.headers['x-tenant-id']) {
      tenantIdentifier = req.headers['x-tenant-id'] as string;
    } else if (req.headers['x-tenant-subdomain']) {
      tenantIdentifier = req.headers['x-tenant-subdomain'] as string;
    }

    if (!tenantIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Tenant information is required'
      });
      return;
    }

    // Find tenant by ID or subdomain
    const tenant = await Tenant.findOne({
      $or: [
        { _id: tenantIdentifier },
        { subdomain: tenantIdentifier }
      ],
      isActive: true
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
      return;
    }

    req.tenant = tenant;
    req.tenantId = tenant._id.toString();

    next();
  } catch (error) {
    logger.error('Tenant context error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting tenant context'
    });
  }
};
