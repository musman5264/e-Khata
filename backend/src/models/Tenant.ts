import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  subdomain: string;
  businessName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  settings: {
    currency: string;
    dateFormat: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      unique: true,
      match: [/^03\d{9}$/, 'Please provide a valid Pakistani mobile number']
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    settings: {
      currency: {
        type: String,
        default: 'PKR'
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY'
      },
      timezone: {
        type: String,
        default: 'Asia/Karachi'
      }
    }
  },
  {
    timestamps: true
  }
);

TenantSchema.index({ subdomain: 1 });
TenantSchema.index({ contactPhone: 1 });

export default mongoose.model<ITenant>('Tenant', TenantSchema);
