import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { Booking } from "@/models/Booking";
import { User } from "@/models/User";
import { requireRole, requireAuth } from "@/middleware/auth";
import { verifyCsrfToken } from "@/lib/auth/csrf";

const CreateBookingSchema = z.object({
  providerId: z.string().length(24), 
  serviceDescription: z.string().min(5).max(500),
  price: z.number().positive(),
  scheduledFor: z.string().datetime(),
});

export const POST = requireRole(["customer"], async (req, { session }) => {
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { providerId, serviceDescription, price, scheduledFor } = parsed.data;

  await connectDB();

  const provider = await User.findOne({ _id: providerId, role: "provider" });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const booking = await Booking.create({
    customerId: session.userId, // always from session, never from client input
    providerId,
    serviceDescription,
    price,
    scheduledFor: new Date(scheduledFor),
    status: "requested",
  });

  return NextResponse.json({ message: "Booking created", booking }, { status: 201 });
});

export const GET = requireAuth(async (req, { session }) => {
  await connectDB();

  const filter =
    session.role === "customer"
      ? { customerId: session.userId }
      : session.role === "provider"
      ? { providerId: session.userId }
      : {}; 

  const bookings = await Booking.find(filter).sort({ createdAt: -1 });

  return NextResponse.json({ bookings });
});