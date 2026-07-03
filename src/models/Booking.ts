import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BookingStatus = "requested" | "accepted" | "completed" | "paid" | "cancelled";

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  serviceDescription: string;
  price: number;
  status: BookingStatus;
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "completed", "paid", "cancelled"],
      default: "requested",
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);