import { Router } from 'express';
import { body } from 'express-validator';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { tenantContext } from '../middleware/tenant';
import { TransactionType, PaymentMethod } from '../models/Transaction';

const router = Router();

// Apply middleware
router.use(tenantContext);
router.use(authenticate);

// Get all transactions
router.get('/', TransactionController.getAllTransactions);

// Get transaction by ID
router.get('/:id', TransactionController.getTransactionById);

// Create transaction
router.post(
  '/',
  [
    body('partyId').notEmpty(),
    body('type').isIn(Object.values(TransactionType)),
    body('amount').isFloat({ min: 0.01 }),
    body('paymentMethod').isIn(Object.values(PaymentMethod))
  ],
  TransactionController.createTransaction
);

// Initiate payment (Easypaisa/JazzCash)
router.post('/payment/initiate', TransactionController.initiatePayment);

// Payment callback
router.post('/payment/callback', TransactionController.paymentCallback);

// Get transaction summary
router.get('/summary/stats', TransactionController.getTransactionSummary);

export default router;
