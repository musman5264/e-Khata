import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  TRANSACTION = 'transaction',
  PAYMENT = 'payment',
  REMINDER = 'reminder',
  ALERT = 'alert',
  SYSTEM = 'system'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read'
}

export interface INotification extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  status: NotificationStatus;
  channels: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    data: {
      type: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING
    },
    channels: {
      push: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: false
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    readAt: {
      type: Date
    },
    sentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
