import mongoose, { Schema, Document, Model } from "mongoose";

export type IpRuleType = "block" | "allow";

export interface IIpRule extends Document {
  ip: string;
  type: IpRuleType;
  reason?: string;
  createdAt: Date;
  expiresAt?: Date; 
}

const IpRuleSchema = new Schema<IIpRule>({
  ip: { type: String, required: true, trim: true },
  type: { type: String, enum: ["block", "allow"], required: true },
  reason: { type: String, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

IpRuleSchema.index({ ip: 1, type: 1 }, { unique: true });

IpRuleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IpRule: Model<IIpRule> =
  mongoose.models.IpRule || mongoose.model<IIpRule>("IpRule", IpRuleSchema);