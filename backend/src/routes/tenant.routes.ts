import { Router } from 'express';
import { body } from 'express-validator';
import { TenantController } from '../controllers/tenant.controller';

const router = Router();

// Create tenant (public route for registration)
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('subdomain').notEmpty().matches(/^[a-z0-9-]+$/),
    body('businessName').notEmpty().trim(),
    body('contactPerson').notEmpty().trim(),
    body('contactPhone').matches(/^03\d{9}$/),
    body('contactEmail').isEmail().normalizeEmail()
  ],
  TenantController.createTenant
);

// Get tenant by subdomain
router.get('/subdomain/:subdomain', TenantController.getTenantBySubdomain);

export default router;
