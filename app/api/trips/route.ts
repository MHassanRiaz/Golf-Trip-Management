import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function getHandler(req: AuthenticatedRequest) {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        organizerId: req.user!.userId,
      },
      include: {
        teams: true,
        participants: true,
        rounds: true,
        _count: {
          select: {
            participants: true,
            rounds: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Get trips error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { name, location, startDate, endDate, description } = body

    // Validate required fields
    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, location, start date, and end date are required" }, { status: 400 })
    }

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        organizerId: req.user!.userId,
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
      },
      include: {
        teams: true,
        participants: true,
      },
    })

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error("Create trip error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
