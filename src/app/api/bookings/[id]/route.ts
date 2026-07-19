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

  //IDOR prevention (object-level authorization)
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
  status: z.enum(["accepted", "completed", "cancelled", "paid"]),
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

  const existing = await Booking.findById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isCustomer = existing.customerId.toString() === session.userId;
  const isProvider = existing.providerId.toString() === session.userId;
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
  if (status === "paid" && !isCustomer && !isAdmin) {
    return NextResponse.json(
      { error: "Only the customer can confirm payment" },
      { status: 403 }
    );
  }

  const validTransitions: Record<string, string[]> = {
    accepted: ["requested"],
    completed: ["accepted"],
    cancelled: ["requested", "accepted"],
    paid: ["completed"],
  };

  const allowedPriorStatuses = validTransitions[status] || [];


  //Race-condition prevention (atomic status transition)
  const updated = await Booking.findOneAndUpdate(
    { _id: params.id, status: { $in: allowedPriorStatuses } },
    { $set: { status } },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Booking status changed before this update could be applied. Please refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ message: "Booking updated", booking: updated });
})