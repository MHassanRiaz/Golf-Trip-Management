// Handicap calculation engine for golf match play

interface Player {
  id: string
  name: string
  handicap: number
}

interface HoleStrokeAllocation {
  hole: number
  strokeIndex: number
  team1Strokes: number
  team2Strokes: number
}

/**
 * Calculates the match handicap for a match based on player handicaps
 * For 2v2: Uses combined team handicaps
 * For 1v1: Uses individual player handicaps
 */
export function calculateMatchHandicap(team1Players: Player[], team2Players: Player[], format: "2v2" | "1v1"): number {
  if (format === "2v2") {
    // For 2v2 Best Ball, use 90% of combined handicap difference
    const team1Combined = team1Players.reduce((sum, p) => sum + p.handicap, 0)
    const team2Combined = team2Players.reduce((sum, p) => sum + p.handicap, 0)
    const difference = Math.abs(team1Combined - team2Combined)
    return Math.round(difference * 0.9) // 90% allowance for best ball
  } else {
    // For 1v1, use 100% of handicap difference
    const player1Handicap = team1Players[0]?.handicap || 0
    const player2Handicap = team2Players[0]?.handicap || 0
    return Math.abs(player1Handicap - player2Handicap)
  }
}

/**
 * Determines which team receives strokes and how many
 */
export function determineStrokeAllocation(
  team1Players: Player[],
  team2Players: Player[],
  format: "2v2" | "1v1",
): {
  receivingTeam: 1 | 2
  strokes: number
} {
  if (format === "2v2") {
    const team1Combined = team1Players.reduce((sum, p) => sum + p.handicap, 0)
    const team2Combined = team2Players.reduce((sum, p) => sum + p.handicap, 0)

    if (team1Combined > team2Combined) {
      return { receivingTeam: 1, strokes: Math.round((team1Combined - team2Combined) * 0.9) }
    } else if (team2Combined > team1Combined) {
      return { receivingTeam: 2, strokes: Math.round((team2Combined - team1Combined) * 0.9) }
    }
    return { receivingTeam: 1, strokes: 0 }
  } else {
    const player1Handicap = team1Players[0]?.handicap || 0
    const player2Handicap = team2Players[0]?.handicap || 0

    if (player1Handicap > player2Handicap) {
      return { receivingTeam: 1, strokes: player1Handicap - player2Handicap }
    } else if (player2Handicap > player1Handicap) {
      return { receivingTeam: 2, strokes: player2Handicap - player1Handicap }
    }
    return { receivingTeam: 1, strokes: 0 }
  }
}

/**
 * Standard stroke index allocation (1 = hardest hole, 18 = easiest)
 * This is a typical stroke index distribution
 */
export const STANDARD_STROKE_INDEX = [10, 4, 14, 2, 12, 8, 16, 6, 18, 1, 11, 5, 15, 3, 13, 7, 17, 9]

/**
 * Generates hole-by-hole stroke allocation for a match
 * Returns which holes each team receives strokes on
 */
export function generateHoleStrokeAllocation(
  team1Players: Player[],
  team2Players: Player[],
  format: "2v2" | "1v1",
  strokeIndex: number[] = STANDARD_STROKE_INDEX,
): HoleStrokeAllocation[] {
  const { receivingTeam, strokes } = determineStrokeAllocation(team1Players, team2Players, format)

  const allocation: HoleStrokeAllocation[] = []

  for (let hole = 1; hole <= 18; hole++) {
    const holeStrokeIndex = strokeIndex[hole - 1]

    // Determine if strokes are given on this hole
    let team1Strokes = 0
    let team2Strokes = 0

    if (holeStrokeIndex <= strokes) {
      if (receivingTeam === 1) {
        team1Strokes = 1
        // If strokes > 18, give 2 strokes on hardest holes
        if (holeStrokeIndex <= strokes - 18) {
          team1Strokes = 2
        }
      } else {
        team2Strokes = 1
        if (holeStrokeIndex <= strokes - 18) {
          team2Strokes = 2
        }
      }
    }

    allocation.push({
      hole,
      strokeIndex: holeStrokeIndex,
      team1Strokes,
      team2Strokes,
    })
  }

  return allocation
}

/**
 * Calculates net score for a player/team on a hole
 */
export function calculateNetScore(grossScore: number, strokesReceived: number): number {
  return Math.max(0, grossScore - strokesReceived)
}

/**
 * Determines the winner of a hole based on net scores
 * Returns: 1 (team1 wins), 2 (team2 wins), 0 (tie)
 */
export function determineHoleWinner(team1NetScore: number, team2NetScore: number): 0 | 1 | 2 {
  if (team1NetScore < team2NetScore) return 1
  if (team2NetScore < team1NetScore) return 2
  return 0
}

/**
 * Calculates match score in match play format (holes up/down)
 * Returns: { team1HolesWon, team2HolesWon, tied }
 */
export function calculateMatchPlayScore(holeResults: Array<{ winner: 0 | 1 | 2 }>): {
  team1HolesWon: number
  team2HolesWon: number
  tied: number
  currentStatus: string // e.g., "2 UP", "All Square", "Dormie"
} {
  let team1HolesWon = 0
  let team2HolesWon = 0
  let tied = 0

  for (const result of holeResults) {
    if (result.winner === 1) team1HolesWon++
    else if (result.winner === 2) team2HolesWon++
    else tied++
  }

  const holesPlayed = holeResults.length
  const holesRemaining = 18 - holesPlayed
  const difference = team1HolesWon - team2HolesWon

  let currentStatus = ""
  if (difference === 0) {
    currentStatus = "All Square"
  } else if (Math.abs(difference) === holesRemaining) {
    currentStatus = "Dormie" // Can't lose from this position
  } else if (Math.abs(difference) > holesRemaining) {
    // Match is decided
    const winner = difference > 0 ? "Team 1" : "Team 2"
    currentStatus = `${winner} wins ${Math.abs(difference)}${holesRemaining > 0 ? ` & ${holesRemaining}` : ""}`
  } else {
    const leader = difference > 0 ? "Team 1" : "Team 2"
    currentStatus = `${leader} ${Math.abs(difference)} UP`
  }

  return {
    team1HolesWon,
    team2HolesWon,
    tied,
    currentStatus,
  }
}

/**
 * Calculates Best Ball score for 2v2 format
 * Takes the best (lowest) net score from each team
 */
export function calculateBestBallScore(
  team1Player1Net: number,
  team1Player2Net: number,
  team2Player1Net: number,
  team2Player2Net: number,
): {
  team1BestBall: number
  team2BestBall: number
  winner: 0 | 1 | 2
} {
  const team1BestBall = Math.min(team1Player1Net, team1Player2Net)
  const team2BestBall = Math.min(team2Player1Net, team2Player2Net)

  let winner: 0 | 1 | 2 = 0
  if (team1BestBall < team2BestBall) winner = 1
  else if (team2BestBall < team1BestBall) winner = 2

  return {
    team1BestBall,
    team2BestBall,
    winner,
  }
}
