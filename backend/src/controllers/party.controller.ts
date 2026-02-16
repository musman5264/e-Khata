import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import Party from '../models/Party';
import Transaction from '../models/Transaction';
import { createAuditLog } from '../middleware/audit';
import { LogCategory } from '../models/AuditLog';
import logger from '../utils/logger';

export class PartyController {
  static async getAllParties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 20, search, partyType } = req.query;

      const query: any = { tenantId, isActive: true };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (partyType) {
        query.partyType = partyType;
      }

      const parties = await Party.find(query)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });

      const total = await Party.countDocuments(query);

      res.json({
        success: true,
        parties,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get all parties error:', error);
      res.status(500).json({ success: false, message: 'Failed to get parties' });
    }
  }

  static async getPartyById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const party = await Party.findOne({ _id: id, tenantId });

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      res.json({ success: true, party });
    } catch (error) {
      logger.error('Get party by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to get party' });
    }
  }

  static async createParty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const tenantId = req.tenantId;
      const userId = req.user?._id;
      const partyData = { ...req.body, tenantId, createdBy: userId };

      // Check if party with same phone exists in this tenant
      const existingParty = await Party.findOne({ 
        tenantId, 
        phone: req.body.phone,
        isActive: true
      });

      if (existingParty) {
        res.status(400).json({ 
          success: false, 
          message: 'Party with this phone number already exists' 
        });
        return;
      }

      const party = await Party.create(partyData);

      await createAuditLog(req, LogCategory.PARTY, 'party_created', { partyId: party._id });

      res.status(201).json({
        success: true,
        message: 'Party created successfully',
        party
      });
    } catch (error) {
      logger.error('Create party error:', error);
      res.status(500).json({ success: false, message: 'Failed to create party' });
    }
  }

  static async updateParty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const tenantId = req.tenantId;
      const updates = req.body;

      const party = await Party.findOneAndUpdate(
        { _id: id, tenantId },
        updates,
        { new: true, runValidators: true }
      );

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      await createAuditLog(req, LogCategory.PARTY, 'party_updated', { partyId: id });

      res.json({ success: true, message: 'Party updated successfully', party });
    } catch (error) {
      logger.error('Update party error:', error);
      res.status(500).json({ success: false, message: 'Failed to update party' });
    }
  }

  static async deleteParty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const party = await Party.findOneAndUpdate(
        { _id: id, tenantId },
        { isActive: false },
        { new: true }
      );

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      await createAuditLog(req, LogCategory.PARTY, 'party_deleted', { partyId: id });

      res.json({ success: true, message: 'Party deleted successfully' });
    } catch (error) {
      logger.error('Delete party error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete party' });
    }
  }

  static async getPartyLedger(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      const party = await Party.findOne({ _id: id, tenantId });

      if (!party) {
        res.status(404).json({ success: false, message: 'Party not found' });
        return;
      }

      const query: any = { tenantId, partyId: id };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const transactions = await Transaction.find(query)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email');

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        party: {
          id: party._id,
          name: party.name,
          currentBalance: party.currentBalance
        },
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get party ledger error:', error);
      res.status(500).json({ success: false, message: 'Failed to get ledger' });
    }
  }
}
