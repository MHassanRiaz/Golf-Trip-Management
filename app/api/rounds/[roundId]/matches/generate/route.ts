import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// Handicap calculation helper
function calculateMatchHandicaps(participants: Array<{ handicapIndex: number }>) {
  const lowestHandicap = Math.min(...participants.map((p) => Number(p.handicapIndex)))
  return participants.map((p) => Math.round(Number(p.handicapIndex) - lowestHandicap))
}

async function postHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ roundId: string }> }) {
  try {
    const { roundId } = await params

    // Get round with foursomes
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        trip: true,
        foursomes: {
          include: {
            participants: {
              include: {
                participant: {
                  include: {
                    team: true,
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
          },
        },
      },
    })

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 })
    }

    // Check authorization
    if (round.trip.organizerId !== req.user!.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if foursomes exist
    if (round.foursomes.length === 0) {
      return NextResponse.json({ error: "No foursomes found for this round" }, { status: 400 })
    }

    const createdMatches = []

    // Generate matches based on format
    for (const foursome of round.foursomes) {
      const players = foursome.participants.map((fp) => fp.participant)

      if (round.format === "TWO_V_TWO") {
        // Create 1 match: 2v2
        const team1Players = players.filter((p) => p.teamId === players[0].teamId)
        const team2Players = players.filter((p) => p.teamId !== players[0].teamId)

        if (team1Players.length !== 2 || team2Players.length !== 2) {
          return NextResponse.json({ error: "2v2 format requires 2 players from each team" }, { status: 400 })
        }

        const allPlayers = [...team1Players, ...team2Players]
        const matchHandicaps = calculateMatchHandicaps(allPlayers)

        const match = await prisma.match.create({
          data: {
            roundId,
            foursomeId: foursome.id,
            matchNumber: 1,
            format: "TWO_V_TWO",
            scorerId: allPlayers[0].id,
            status: "PLANNED",
            participants: {
              create: allPlayers.map((player, index) => ({
                participantId: player.id,
                teamId: player.teamId,
                matchHandicap: matchHandicaps[index],
                position: index + 1,
              })),
            },
          },
          include: {
            participants: {
              include: {
                participant: true,
                team: true,
              },
            },
          },
        })

        createdMatches.push(match)
      } else {
        // Create 2 matches: 1v1
        const team1Player = players.find((p) => p.teamId === players[0].teamId)
        const team2Player = players.find((p) => p.teamId !== players[0].teamId)

        if (!team1Player || !team2Player) {
          return NextResponse.json({ error: "1v1 format requires 1 player from each team per match" }, { status: 400 })
        }

        const matchPlayers = [team1Player, team2Player]
        const matchHandicaps = calculateMatchHandicaps(matchPlayers)

        const match = await prisma.match.create({
          data: {
            roundId,
            foursomeId: foursome.id,
            matchNumber: 1,
            format: "ONE_V_ONE",
            scorerId: matchPlayers[0].id,
            status: "PLANNED",
            participants: {
              create: matchPlayers.map((player, index) => ({
                participantId: player.id,
                teamId: player.teamId,
                matchHandicap: matchHandicaps[index],
                position: index + 1,
              })),
            },
          },
          include: {
            participants: {
              include: {
                participant: true,
                team: true,
              },
            },
          },
        })

        createdMatches.push(match)
      }
    }

    // Update round status
    await prisma.round.update({
      where: { id: roundId },
      data: { status: "IN_PROGRESS" },
    })

    return NextResponse.json({ matches: createdMatches }, { status: 201 })
  } catch (error) {
    console.error("Generate matches error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
