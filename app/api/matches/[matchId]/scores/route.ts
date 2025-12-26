import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST - Create or update hole scores for all players in a match
export async function POST(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const { matchId } = params
    const body = await request.json()

    // Get match details to find participants
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    for (const hole of body.holes) {
      // Get player scores from the request
      const playerScores = [
        { playerNum: 1, gross: hole.player1Gross },
        { playerNum: 2, gross: hole.player2Gross },
        { playerNum: 3, gross: hole.player3Gross },
        { playerNum: 4, gross: hole.player4Gross },
      ]

      // Get match participants in order
      const participants = await prisma.matchParticipant.findMany({
        where: { matchId },
        orderBy: { position: "asc" },
        include: { participant: true },
      })

      // Save or update hole score for each participant
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i]
        const playerScore = playerScores[i]

        if (playerScore.gross !== undefined && playerScore.gross !== null) {
          // Calculate net score
          const netScore = Math.max(1, playerScore.gross - participant.matchHandicap)

          await prisma.holeScore.upsert({
            where: {
              matchId_holeNumber_participantId: {
                matchId,
                holeNumber: hole.hole,
                participantId: participant.participantId,
              },
            },
            update: {
              grossStrokes: playerScore.gross,
              netStrokes: netScore,
              drinkCount: hole.drinks || 0,
              drinkingAdjustedNet: netScore + (hole.drinks || 0),
              strokesReceived: participant.matchHandicap,
            },
            create: {
              matchId,
              participantId: participant.participantId,
              holeNumber: hole.hole,
              par: 4, // Default, should come from course
              strokeIndex: hole.hole,
              grossStrokes: playerScore.gross,
              netStrokes: netScore,
              drinkCount: hole.drinks || 0,
              drinkingAdjustedNet: netScore + (hole.drinks || 0),
              strokesReceived: participant.matchHandicap,
            },
          })
        }
      }
    }

    const completedHoles = body.holes.filter((hole: any) => {
      return [hole.player1Gross, hole.player2Gross, hole.player3Gross, hole.player4Gross].every(
        (s: any) => s !== undefined && s !== null,
      )
    }).length

    const totalHoles = body.holes.length
    let newStatus = match.status
    if (completedHoles > 0 && completedHoles < totalHoles) {
      newStatus = "IN_PROGRESS"
    } else if (completedHoles === totalHoles && totalHoles > 0) {
      newStatus = "COMPLETED"
    }

    // Update match with new status
    if (newStatus !== match.status) {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: newStatus,
          completedAt: newStatus === "COMPLETED" ? new Date() : null,
        },
      })
    }

    return NextResponse.json(
      { success: true, message: "Scores saved", completedHoles, totalHoles, status: newStatus },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Score API error:", error)
    return NextResponse.json({ error: "Failed to save scores", details: String(error) }, { status: 500 })
  }
}

// GET - Retrieve all hole scores for a match
export async function GET(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const { matchId } = params

    const holeScores = await prisma.holeScore.findMany({
      where: { matchId },
      include: {
        participant: { select: { name: true } },
      },
      orderBy: [{ holeNumber: "asc" }, { participantId: "asc" }],
    })

    return NextResponse.json({ success: true, scores: holeScores }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get scores error:", error)
    return NextResponse.json({ error: "Failed to retrieve scores" }, { status: 500 })
  }
}
