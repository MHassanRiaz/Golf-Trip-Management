import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getTokenFromHeader, type JWTPayload } from "./jwt"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const token = getTokenFromHeader(req.headers.get("authorization") || "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = user

    return handler(authenticatedReq, context)
  }
}
