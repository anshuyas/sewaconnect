import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "account_locked"
  | "mfa_enabled"
  | "role_change_attempt_blocked"
  | "booking_created"
  | "booking_status_changed"
  | "provider_verification_decision"
  | "profile_updated";

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: AuditAction;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);