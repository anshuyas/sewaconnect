import { Document } from "mongoose";

export function isOwnerOrAdmin(
  resourceOwnerId: string,
  sessionUserId: string,
  sessionRole: string
): boolean {
  if (sessionRole === "admin") return true;
  return resourceOwnerId === sessionUserId;
}