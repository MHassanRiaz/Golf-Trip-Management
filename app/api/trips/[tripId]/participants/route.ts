import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params

    const participants = await prisma.participant.findMany({
      where: { tripId },
      include: {
        team: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({ participants })
  } catch (error) {
    console.error("Get participants error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params
    const body = await req.json()
    const { name, ghinNumber, handicapIndex, email, phone, teamId, userId } = body

    // Validate required fields
    if (!name || !handicapIndex || !teamId) {
      return NextResponse.json({ error: "Name, handicap index, and team are required" }, { status: 400 })
    }

    // Validate handicap range
    if (handicapIndex < 0 || handicapIndex > 54) {
      return NextResponse.json({ error: "Handicap index must be between 0 and 54" }, { status: 400 })
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check authorization
    if (trip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team || team.tripId !== tripId) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 })
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        tripId,
        teamId,
        userId: userId || null,
        name,
        ghinNumber: ghinNumber || null,
        handicapIndex,
        email: email || null,
        phone: phone || null,
      },
      include: {
        team: true,
      },
    })

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    console.error("Create participant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
