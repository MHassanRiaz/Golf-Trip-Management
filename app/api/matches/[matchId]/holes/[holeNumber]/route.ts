import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST - Update specific hole score for a participant
export async function POST(request: NextRequest, { params }: { params: { matchId: string; holeNumber: string } }) {
  try {
    const { matchId, holeNumber } = params
    const { participantId, gross_strokes, drink_count, net_strokes } = await request.json()

    const holeScore = await prisma.hole_Scores.upsert({
      where: {
        matchId_hole_number_participantId: {
          matchId,
          hole_number: Number.parseInt(holeNumber),
          participantId,
        },
      },
      update: {
        gross_strokes,
        drink_count: drink_count || 0,
        net_strokes: net_strokes || gross_strokes,
        drinking_adjusted_net: net_strokes ? net_strokes + (drink_count || 0) : gross_strokes,
        updated_at: new Date(),
      },
      create: {
        matchId,
        hole_number: Number.parseInt(holeNumber),
        participantId,
        par: 4,
        stroke_index: 1,
        gross_strokes,
        net_strokes: net_strokes || gross_strokes,
        drink_count: drink_count || 0,
        drinking_adjusted_net: net_strokes ? net_strokes + (drink_count || 0) : gross_strokes,
        strokes_received: 0,
      },
    })

    const allHolesForMatch = await prisma.hole_Scores.findMany({
      where: { matchId },
    })

    const completedHoles = allHolesForMatch.filter((h) => h.gross_strokes > 0).length
    const totalHoles = 5

    if (completedHoles > 0 && completedHoles < totalHoles) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "in-progress" },
      })
    } else if (completedHoles === totalHoles) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "completed", completed_at: new Date() },
      })
    }

    return NextResponse.json({ success: true, holeScore }, { status: 200 })
  } catch (error) {
    console.error("[v0] Hole score update error:", error)
    return NextResponse.json({ error: "Failed to update hole score" }, { status: 500 })
  }
}

// GET - Retrieve specific hole score
export async function GET(request: NextRequest, { params }: { params: { matchId: string; holeNumber: string } }) {
  try {
    const { matchId, holeNumber } = params

    const holeScores = await prisma.hole_Scores.findMany({
      where: {
        matchId,
        hole_number: Number.parseInt(holeNumber),
      },
    })

    return NextResponse.json({ success: true, scores: holeScores }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get hole score error:", error)
    return NextResponse.json({ error: "Failed to retrieve hole score" }, { status: 500 })
  }
}
