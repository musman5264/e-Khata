import { Router } from 'express';
import { body } from 'express-validator';
import { PartyController } from '../controllers/party.controller';
import { authenticate } from '../middleware/auth';
import { tenantContext } from '../middleware/tenant';

const router = Router();

// Apply middleware
router.use(tenantContext);
router.use(authenticate);

// Get all parties
router.get('/', PartyController.getAllParties);

// Get party by ID
router.get('/:id', PartyController.getPartyById);

// Create party
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('phone').matches(/^03\d{9}$/),
    body('email').optional().isEmail().normalizeEmail(),
    body('partyType').isIn(['customer', 'supplier', 'both'])
  ],
  PartyController.createParty
);

// Update party
router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('phone').optional().matches(/^03\d{9}$/),
    body('email').optional().isEmail().normalizeEmail()
  ],
  PartyController.updateParty
);

// Delete party
router.delete('/:id', PartyController.deleteParty);

// Get party ledger
router.get('/:id/ledger', PartyController.getPartyLedger);

export default router;
