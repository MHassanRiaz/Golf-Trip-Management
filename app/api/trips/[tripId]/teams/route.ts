import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params

    const teams = await prisma.team.findMany({
      where: { tripId },
      include: {
        participants: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params
    const body = await req.json()
    const { name, color } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        teams: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check authorization
    if (trip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Enforce maximum 2 teams
    if (trip.teams.length >= 2) {
      return NextResponse.json({ error: "Maximum 2 teams allowed per trip" }, { status: 400 })
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        tripId,
        name,
        color: color || null,
      },
      include: {
        participants: true,
      },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
