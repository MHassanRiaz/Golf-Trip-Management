import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        teams: {
          include: {
            participants: true,
          },
        },
        participants: {
          include: {
            team: true,
          },
        },
        rounds: {
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
              },
            },
          },
          orderBy: {
            roundNumber: "asc",
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check authorization
    if (trip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Get trip error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params
    const body = await req.json()
    const { name, location, startDate, endDate, description } = body

    // Check if trip exists and user is organizer
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (existingTrip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update trip
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        name: name || existingTrip.name,
        location: location || existingTrip.location,
        startDate: startDate ? new Date(startDate) : existingTrip.startDate,
        endDate: endDate ? new Date(endDate) : existingTrip.endDate,
        description: description !== undefined ? description : existingTrip.description,
      },
      include: {
        teams: true,
        participants: true,
      },
    })

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Update trip error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params

    // Check if trip exists and user is organizer
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (existingTrip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete trip (cascade will handle related records)
    await prisma.trip.delete({
      where: { id: tripId },
    })

    return NextResponse.json({ message: "Trip deleted successfully" })
  } catch (error) {
    console.error("Delete trip error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)
export const DELETE = withAuth(deleteHandler)
