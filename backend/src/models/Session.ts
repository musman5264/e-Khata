import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  refreshToken: string;
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    deviceName: string;
    ipAddress: string;
    userAgent: string;
  };
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
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
    sessionToken: {
      type: String,
      required: true,
      unique: true
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true
    },
    deviceInfo: {
      deviceId: {
        type: String,
        required: true
      },
      deviceType: {
        type: String,
        required: true
      },
      deviceName: {
        type: String,
        required: true
      },
      ipAddress: {
        type: String,
        required: true
      },
      userAgent: {
        type: String,
        required: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ sessionToken: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISession>('Session', SessionSchema);
