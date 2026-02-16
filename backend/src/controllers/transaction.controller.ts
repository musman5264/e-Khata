import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import Transaction, { TransactionType, PaymentMethod } from '../models/Transaction';
import Party from '../models/Party';
import { EasypaisaService } from '../services/easypaisa.service';
import { JazzCashService } from '../services/jazzcash.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../models/Notification';
import { createAuditLog } from '../middleware/audit';
import { LogCategory } from '../models/AuditLog';
import logger from '../utils/logger';

export class TransactionController {
  static async getAllTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, partyId, type, startDate, endDate } = req.query;

      const query: any = { tenantId };

      if (partyId) query.partyId = partyId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const transactions = await Transaction.find(query)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 })
        .populate('partyId', 'name phone')
        .populate('createdBy', 'name email');

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get all transactions error:', error);
      res.status(500).json({ success: false, message: 'Failed to get transactions' });
    }
  }

  static async getTransactionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const transaction = await Transaction.findOne({ _id: id, tenantId })
        .populate('partyId', 'name phone')
        .populate('createdBy', 'name email');

      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      res.json({ success: true, transaction });
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to get transaction' });
    }
  }

  static async createTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const tenantId = req.tenantId;
      const userId = req.user?._id;
      const { partyId, type, amount, paymentMethod, reference, description } = req.body;

      // Get party
      const party = await Party.findOne({ _id: partyId, tenantId });

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      // Calculate new balance
      let newBalance = party.currentBalance;
      if (type === TransactionType.DEBIT) {
        newBalance += amount;
      } else {
        newBalance -= amount;
      }

      // Create transaction
      const transaction = await Transaction.create({
        tenantId,
        partyId,
        type,
        amount,
        paymentMethod,
        reference,
        description,
        balanceAfter: newBalance,
        createdBy: userId
      });

      // Update party balance
      party.currentBalance = newBalance;
      await party.save();

      await createAuditLog(req, LogCategory.TRANSACTION, 'transaction_created', { 
        transactionId: transaction._id,
        partyId,
        amount,
        type
      });

      // Send notification
      await NotificationService.createNotification({
        tenantId: tenantId!,
        userId: userId!.toString(),
        type: NotificationType.TRANSACTION,
        title: 'Transaction Created',
        message: `${type === TransactionType.DEBIT ? 'Debit' : 'Credit'} of PKR ${amount} for ${party.name}`,
        data: { transactionId: transaction._id },
        channels: { push: true }
      });

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction
      });
    } catch (error) {
      logger.error('Create transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to create transaction' });
    }
  }

  static async initiatePayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const { 
        partyId, 
        amount, 
        paymentGateway, 
        orderId, 
        description, 
        callbackUrl 
      } = req.body;

      const party = await Party.findOne({ _id: partyId, tenantId });

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      const paymentRequest = {
        amount,
        orderId,
        description,
        customerPhone: party.phone,
        customerEmail: party.email,
        callbackUrl
      };

      let result;

      if (paymentGateway === 'easypaisa') {
        result = await EasypaisaService.initiatePayment(paymentRequest);
      } else if (paymentGateway === 'jazzcash') {
        result = await JazzCashService.initiatePayment(paymentRequest);
      } else {
        res.status(400).json({ success: false, message: 'Invalid payment gateway' });
        return;
      }

      await createAuditLog(req, LogCategory.PAYMENT, 'payment_initiated', {
        partyId,
        amount,
        paymentGateway,
        transactionId: result.transactionId
      });

      res.json(result);
    } catch (error) {
      logger.error('Initiate payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to initiate payment' });
    }
  }

  static async paymentCallback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId, status, orderId } = req.body;

      logger.info('Payment callback received:', { transactionId, status, orderId });

      // Update transaction with payment status
      // In production, you would verify the payment status with the payment gateway

      await createAuditLog(req, LogCategory.PAYMENT, 'payment_callback', {
        transactionId,
        status,
        orderId
      });

      res.json({ success: true, message: 'Callback processed' });
    } catch (error) {
      logger.error('Payment callback error:', error);
      res.status(500).json({ success: false, message: 'Failed to process callback' });
    }
  }

  static async getTransactionSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const query: any = { tenantId };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const summary = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        totalDebit: 0,
        totalCredit: 0,
        debitCount: 0,
        creditCount: 0
      };

      summary.forEach(item => {
        if (item._id === TransactionType.DEBIT) {
          result.totalDebit = item.totalAmount;
          result.debitCount = item.count;
        } else {
          result.totalCredit = item.totalAmount;
          result.creditCount = item.count;
        }
      });

      res.json({ success: true, summary: result });
    } catch (error) {
      logger.error('Get transaction summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to get summary' });
    }
  }
}
