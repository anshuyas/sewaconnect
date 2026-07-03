import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface IProviderProfile extends Document {
  userId: Types.ObjectId;
  serviceCategory: string;
  hourlyRate: number;
  bio?: string;
  verificationStatus: VerificationStatus;
  verificationDocument?: string; // encrypted at rest
  createdAt: Date;
  updatedAt: Date;
}

const ProviderProfileSchema = new Schema<IProviderProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per provider
    },
    serviceCategory: {
      type: String,
      required: true,
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationDocument: {
      type: String,
      select: false, 
    },
  },
  { timestamps: true }
);

export const ProviderProfile: Model<IProviderProfile> =
  mongoose.models.ProviderProfile ||
  mongoose.model<IProviderProfile>("ProviderProfile", ProviderProfileSchema);