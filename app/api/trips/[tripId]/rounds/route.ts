import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params

    const rounds = await prisma.round.findMany({
      where: { tripId },
      include: {
        foursomes: {
          include: {
            participants: {
              include: {
                participant: true,
              },
            },
          },
        },
        matches: {
          include: {
            participants: {
              include: {
                participant: true,
                team: true,
              },
            },
            winnerTeam: true,
          },
        },
      },
      orderBy: {
        roundNumber: "asc",
      },
    })

    return NextResponse.json({ rounds })
  } catch (error) {
    console.error("Get rounds error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params
    const body = await req.json()
    const { courseName, teeBox, format, drinkingMode, date } = body

    // Validate required fields
    if (!courseName || !teeBox || !format || !date) {
      return NextResponse.json({ error: "Course name, tee box, format, and date are required" }, { status: 400 })
    }

    // Validate format
    if (format !== "2v2" && format !== "1v1") {
      return NextResponse.json({ error: "Format must be '2v2' or '1v1'" }, { status: 400 })
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

    // Get next round number
    const lastRound = await prisma.round.findFirst({
      where: { tripId },
      orderBy: { roundNumber: "desc" },
    })

    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1

    // Create round
    const round = await prisma.round.create({
      data: {
        tripId,
        roundNumber,
        courseName,
        teeBox,
        format: format === "2v2" ? "TWO_V_TWO" : "ONE_V_ONE",
        drinkingMode: drinkingMode || false,
        date: new Date(date),
        status: "PENDING",
      },
    })

    return NextResponse.json({ round }, { status: 201 })
  } catch (error) {
    console.error("Create round error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
