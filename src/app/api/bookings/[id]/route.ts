import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { Booking } from "@/models/Booking";
import { requireAuth } from "@/middleware/auth";
import { isOwnerOrAdmin } from "@/middleware/ownership";
import { verifyCsrfToken } from "@/lib/auth/csrf";

export const GET = requireAuth(async (req, { session, params }) => {
  await connectDB();

  const booking = await Booking.findById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isCustomer = booking.customerId.toString() === session.userId;
  const isProvider = booking.providerId.toString() === session.userId;
  const allowed =
    isCustomer ||
    isProvider ||
    isOwnerOrAdmin(booking.customerId.toString(), session.userId, session.role);

  if (!allowed) {
    return NextResponse.json({ error: "Not authorized to view this booking" }, { status: 403 });
  }

  return NextResponse.json({ booking });
});

const UpdateStatusSchema = z.object({
  status: z.enum(["accepted", "completed", "cancelled"]),
});

export const PATCH = requireAuth(async (req, { session, params }) => {
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const booking = await Booking.findById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isCustomer = booking.customerId.toString() === session.userId;
  const isProvider = booking.providerId.toString() === session.userId;
  const isAdmin = session.role === "admin";

  const { status } = parsed.data;

  if ((status === "accepted" || status === "completed") && !isProvider && !isAdmin) {
    return NextResponse.json(
      { error: "Only the assigned provider can update this status" },
      { status: 403 }
    );
  }

  if (status === "cancelled" && !isCustomer && !isProvider && !isAdmin) {
    return NextResponse.json({ error: "Not authorized to cancel this booking" }, { status: 403 });
  }

  booking.status = status;
  await booking.save();

  return NextResponse.json({ message: "Booking updated", booking });
});