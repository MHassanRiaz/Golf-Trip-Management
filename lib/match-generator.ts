// Match generation utility for creating matches from foursomes

import { calculateMatchHandicap } from "./handicap-engine"

interface Participant {
  id: string
  name: string
  handicap: number
  team: string
}

interface Foursome {
  id: string
  roundId: string
  name: string
  players: string[]
  teeTime?: string
}

interface Match {
  foursomeId: string
  roundId: string
  format: "2v2" | "1v1"
  team1Players: string[]
  team2Players: string[]
  scorer?: string
  matchHandicap?: number
  status: "planned" | "in-progress" | "completed"
}

/**
 * Generates matches from a foursome based on the round format
 * For 2v2: Creates 1 match with 2v2 teams
 * For 1v1: Creates 2 matches with 1v1 matchups
 */
export function generateMatchesFromFoursome(
  foursome: Foursome,
  format: "2v2" | "1v1",
  participants: Participant[],
): Omit<Match, "id" | "createdAt">[] {
  const matches: Omit<Match, "id" | "createdAt">[] = []

  if (foursome.players.length !== 4) {
    throw new Error("Foursome must have exactly 4 players")
  }

  const players = foursome.players.map((id) => participants.find((p) => p.id === id)).filter(Boolean) as Participant[]

  if (players.length !== 4) {
    throw new Error("Could not find all players in foursome")
  }

  // Sort players by team to group them
  const teamAPlayers = players.filter((p) => p.team === "Team A")
  const teamBPlayers = players.filter((p) => p.team === "Team B")

  if (format === "2v2") {
    // Create one 2v2 match
    // If teams are balanced (2v2), use team grouping
    if (teamAPlayers.length === 2 && teamBPlayers.length === 2) {
      const matchHandicap = calculateMatchHandicap(
        [teamAPlayers[0], teamAPlayers[1]],
        [teamBPlayers[0], teamBPlayers[1]],
        "2v2",
      )

      matches.push({
        foursomeId: foursome.id,
        roundId: foursome.roundId,
        format: "2v2",
        team1Players: [teamAPlayers[0].id, teamAPlayers[1].id],
        team2Players: [teamBPlayers[0].id, teamBPlayers[1].id],
        scorer: foursome.players[0],
        matchHandicap,
        status: "planned",
      })
    } else {
      // If teams aren't balanced, pair them differently
      // Players 1&2 vs Players 3&4
      const matchHandicap = calculateMatchHandicap([players[0], players[1]], [players[2], players[3]], "2v2")

      matches.push({
        foursomeId: foursome.id,
        roundId: foursome.roundId,
        format: "2v2",
        team1Players: [players[0].id, players[1].id],
        team2Players: [players[2].id, players[3].id],
        scorer: players[0].id,
        matchHandicap,
        status: "planned",
      })
    }
  } else if (format === "1v1") {
    // Create two 1v1 matches
    // Match 1: Player 1 vs Player 3
    const match1Handicap = calculateMatchHandicap([players[0]], [players[2]], "1v1")
    const match2Handicap = calculateMatchHandicap([players[1]], [players[3]], "1v1")

    matches.push(
      {
        foursomeId: foursome.id,
        roundId: foursome.roundId,
        format: "1v1",
        team1Players: [players[0].id],
        team2Players: [players[2].id],
        scorer: players[1].id,
        matchHandicap: match1Handicap,
        status: "planned",
      },
      {
        foursomeId: foursome.id,
        roundId: foursome.roundId,
        format: "1v1",
        team1Players: [players[1].id],
        team2Players: [players[3].id],
        scorer: players[0].id,
        matchHandicap: match2Handicap,
        status: "planned",
      },
    )
  }

  return matches
}

/**
 * Auto-generates all matches for a round based on its foursomes and format
 */
export function generateAllMatchesForRound(
  roundId: string,
  format: "2v2" | "1v1",
  foursomes: Foursome[],
  participants: Participant[],
): Omit<Match, "id" | "createdAt">[] {
  const allMatches: Omit<Match, "id" | "createdAt">[] = []

  for (const foursome of foursomes) {
    if (foursome.roundId === roundId) {
      const matches = generateMatchesFromFoursome(foursome, format, participants)
      allMatches.push(...matches)
    }
  }

  return allMatches
}
