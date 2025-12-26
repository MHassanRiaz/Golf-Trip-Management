import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ roundId: string }> }) {
  try {
    const { roundId } = await params
    const body = await req.json()
    const { foursomes } = body // Array of foursome participant arrays

    // Validate required fields
    if (!foursomes || !Array.isArray(foursomes)) {
      return NextResponse.json({ error: "Foursomes array is required" }, { status: 400 })
    }

    // Get round
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        trip: true,
      },
    })

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 })
    }

    // Check authorization
    if (round.trip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate foursome count based on format
    const expectedFoursomeCount = round.format === "TWO_V_TWO" ? 1 : 2
    if (foursomes.length !== expectedFoursomeCount) {
      return NextResponse.json(
        { error: `Format ${round.format} requires ${expectedFoursomeCount} foursome(s)` },
        { status: 400 },
      )
    }

    // Create foursomes
    const createdFoursomes = []
    for (let i = 0; i < foursomes.length; i++) {
      const participantIds = foursomes[i]

      // Validate participant count
      const expectedParticipantCount = round.format === "TWO_V_TWO" ? 4 : 2
      if (participantIds.length !== expectedParticipantCount) {
        return NextResponse.json(
          { error: `Each foursome must have exactly ${expectedParticipantCount} participants` },
          { status: 400 },
        )
      }

      // Create foursome
      const foursome = await prisma.foursome.create({
        data: {
          roundId,
          foursomeNumber: i + 1,
          participants: {
            create: participantIds.map((participantId: string, index: number) => ({
              participantId,
              position: index + 1,
            })),
          },
        },
        include: {
          participants: {
            include: {
              participant: {
                include: {
                  team: true,
                },
              },
            },
          },
        },
      })

      createdFoursomes.push(foursome)
    }

    // Update round status
    await prisma.round.update({
      where: { id: roundId },
      data: { status: "PENDING" },
    })

    return NextResponse.json({ foursomes: createdFoursomes }, { status: 201 })
  } catch (error) {
    console.error("Create foursomes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
