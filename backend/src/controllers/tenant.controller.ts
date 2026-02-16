import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import logger from '../utils/logger';

export class TenantController {
  static async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { 
        name, 
        subdomain, 
        businessName, 
        contactPerson, 
        contactPhone, 
        contactEmail,
        adminPassword 
      } = req.body;

      // Check if subdomain already exists
      const existingTenant = await Tenant.findOne({ subdomain });

      if (existingTenant) {
        res.status(400).json({ 
          success: false, 
          message: 'Subdomain already taken' 
        });
        return;
      }

      // Create tenant
      const tenant = await Tenant.create({
        name,
        subdomain,
        businessName,
        contactPerson,
        contactPhone,
        contactEmail
      });

      // Create admin user for the tenant
      const adminUser = await User.create({
        tenantId: tenant._id,
        name: contactPerson,
        email: contactEmail,
        phone: contactPhone,
        password: adminPassword || 'Admin@123',
        role: UserRole.ADMIN,
        isActive: true
      });

      logger.info(`Tenant created: ${tenant.subdomain} with admin user: ${adminUser.email}`);

      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        tenant: {
          id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          businessName: tenant.businessName
        },
        admin: {
          email: adminUser.email,
          phone: adminUser.phone
        }
      });
    } catch (error) {
      logger.error('Create tenant error:', error);
      res.status(500).json({ success: false, message: 'Failed to create tenant' });
    }
  }

  static async getTenantBySubdomain(req: Request, res: Response): Promise<void> {
    try {
      const { subdomain } = req.params;

      const tenant = await Tenant.findOne({ subdomain, isActive: true });

      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      res.json({
        success: true,
        tenant: {
          id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          businessName: tenant.businessName,
          settings: tenant.settings
        }
      });
    } catch (error) {
      logger.error('Get tenant by subdomain error:', error);
      res.status(500).json({ success: false, message: 'Failed to get tenant' });
    }
  }
}
