import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SessionUser } from "@/lib/auth/session";

type RouteHandler = (
  req: NextRequest,
  context: { session: SessionUser; params?: any }
) => Promise<NextResponse>;

export function requireAuth(handler: RouteHandler) {
  return async (req: NextRequest, routeContext?: { params?: any }) => {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return handler(req, { session, params: routeContext?.params });
  };
}

export function requireRole(allowedRoles: string[], handler: RouteHandler) {
  return requireAuth(async (req, context) => {
    if (!allowedRoles.includes(context.session.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    return handler(req, context);
  });
}