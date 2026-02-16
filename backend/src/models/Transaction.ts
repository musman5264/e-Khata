import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
  CHEQUE = 'cheque',
  OTHER = 'other'
}

export interface ITransaction extends Document {
  tenantId: mongoose.Types.ObjectId;
  partyId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  description?: string;
  balanceAfter: number;
  paymentGatewayReference?: string;
  paymentGatewayStatus?: string;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required']
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: [true, 'Party ID is required']
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required']
    },
    reference: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    paymentGatewayReference: {
      type: String,
      trim: true
    },
    paymentGatewayStatus: {
      type: String,
      trim: true
    },
    attachments: [{
      type: String
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
TransactionSchema.index({ tenantId: 1, partyId: 1, createdAt: -1 });
TransactionSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
