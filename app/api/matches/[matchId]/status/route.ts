import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PUT - Update match status
export async function PUT(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const { matchId } = params
    const { status } = await request.json()

    const match = await prisma.match.update({
      where: { id: matchId },
      data: { status },
    })

    return NextResponse.json({ success: true, match }, { status: 200 })
  } catch (error) {
    console.error("[v0] Update status error:", error)
    return NextResponse.json({ error: "Failed to update match status" }, { status: 500 })
  }
}

// GET - Retrieve match status and current scores
export async function GET(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const { matchId } = params

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        hole_scores: {
          orderBy: { hole_number: "asc" },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Calculate current status based on completed holes
    const completedHoles = match.hole_scores.filter((h) => h.gross_strokes > 0).length
    const totalHoles = 5 // Or get from round settings

    let status = "planned"
    if (completedHoles > 0 && completedHoles < totalHoles) {
      status = "in-progress"
    } else if (completedHoles === totalHoles) {
      status = "completed"
    }

    return NextResponse.json(
      {
        success: true,
        match: {
          ...match,
          currentStatus: status,
          completedHoles,
          totalHoles,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get status error:", error)
    return NextResponse.json({ error: "Failed to retrieve match status" }, { status: 500 })
  }
}
