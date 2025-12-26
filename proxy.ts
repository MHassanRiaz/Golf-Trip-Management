import { type NextRequest, NextResponse } from "next/server"
import { getTokenFromHeader, verifyToken } from "./lib/jwt"

const publicRoutes = ["/login", "/signup", "/", "/api/auth/login", "/api/auth/register"]
const protectedRoutes = ["/dashboard", "/trips", "/scoring", "/leaderboard", "/rounds", "/standings", "/expenses"]

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const token = getTokenFromHeader(req.headers.get("authorization") || "") || req.cookies.get("auth_token")?.value

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // API routes - check token in header
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Protected pages - redirect to login if no token
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const user = verifyToken(token)
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url))
      response.cookies.delete("auth_token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
