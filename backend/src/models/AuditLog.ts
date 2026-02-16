import mongoose, { Schema, Document } from 'mongoose';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

export enum LogCategory {
  AUTH = 'auth',
  TRANSACTION = 'transaction',
  PAYMENT = 'payment',
  USER = 'user',
  PARTY = 'party',
  SYSTEM = 'system',
  NOTIFICATION = 'notification'
}

export interface IAuditLog extends Document {
  tenantId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  level: LogLevel;
  category: LogCategory;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: true
    },
    category: {
      type: String,
      enum: Object.values(LogCategory),
      required: true
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
