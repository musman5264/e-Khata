import mongoose, { Schema, Document } from 'mongoose';

export interface IParty extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  cnic?: string;
  businessName?: string;
  partyType: 'customer' | 'supplier' | 'both';
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required']
    },
    name: {
      type: String,
      required: [true, 'Party name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^03\d{9}$/, 'Please provide a valid Pakistani mobile number']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    address: {
      type: String,
      trim: true
    },
    cnic: {
      type: String,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'Please provide a valid CNIC format (xxxxx-xxxxxxx-x)']
    },
    businessName: {
      type: String,
      trim: true
    },
    partyType: {
      type: String,
      enum: ['customer', 'supplier', 'both'],
      default: 'customer'
    },
    openingBalance: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true
    },
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

// Ensure unique phone per tenant
PartySchema.index({ tenantId: 1, phone: 1 }, { unique: true });
PartySchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.model<IParty>('Party', PartySchema);
