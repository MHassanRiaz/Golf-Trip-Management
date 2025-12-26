// Real-time standings calculator for team leaderboard

interface Player {
  id: string
  name: string
  team: string
}

interface Match {
  id: string
  roundId: string
  team1Players: string[]
  team2Players: string[]
  format: "2v2" | "1v1"
}

interface HoleScore {
  hole: number
  player1Gross?: number
  player2Gross?: number
  player3Gross?: number
  player4Gross?: number
  drinks?: number
}

interface MatchScore {
  matchId: string
  holes: HoleScore[]
  completedHoles: number
}

interface HoleAllocation {
  hole: number
  team1Strokes: number
  team2Strokes: number
}

interface TeamStanding {
  teamName: string
  wins: number
  losses: number
  ties: number
  points: number
  drinkPoints: number
  matchesPlayed: number
}

interface Team {
  id: string
  name: string
  color: string
  members: string[]
}

interface Participant {
  id: string
  name: string
  team: string
  handicap: number
}

interface Round {
  id: string
  drinkingMode?: boolean
}

interface StandingResult {
  teamId: string
  teamName: string
  wins: number
  losses: number
  ties: number
  points: number
  drinkPoints: number
  netScore: number
  drinkingMode: boolean
}

/**
 * Calculates net score for a player
 */
function calculateNetScore(grossScore: number, strokes: number): number {
  return Math.max(0, grossScore - strokes)
}

/**
 * Determines the winner of a hole (1 = team1, 2 = team2, 0 = tie)
 */
function determineHoleWinner(team1Net: number, team2Net: number): 0 | 1 | 2 {
  if (team1Net < team2Net) return 1
  if (team2Net < team1Net) return 2
  return 0
}

/**
 * Calculates best ball score for 2v2 format
 */
function calculateBestBall(
  p1Net: number,
  p2Net: number,
  p3Net: number,
  p4Net: number,
): {
  team1Best: number
  team2Best: number
  winner: 0 | 1 | 2
} {
  const team1Best = Math.min(p1Net, p2Net)
  const team2Best = Math.min(p3Net, p4Net)

  let winner: 0 | 1 | 2 = 0
  if (team1Best < team2Best) winner = 1
  else if (team2Best < team1Best) winner = 2

  return { team1Best, team2Best, winner }
}

/**
 * Calculates match result from scorecard
 */
export function calculateMatchResult(
  matchScore: MatchScore,
  match: Match,
  holeAllocations: HoleAllocation[],
): {
  team1HolesWon: number
  team2HolesWon: number
  tied: number
  matchWinner: 0 | 1 | 2 // 0 = tie, 1 = team1, 2 = team2
  totalDrinks: number
} {
  let team1HolesWon = 0
  let team2HolesWon = 0
  let tied = 0
  let totalDrinks = 0

  for (const holeData of matchScore.holes) {
    const allocation = holeAllocations.find((a) => a.hole === holeData.hole)
    if (!allocation) continue

    // Add drinks for this hole
    totalDrinks += holeData.drinks || 0

    if (match.format === "2v2") {
      // Best Ball scoring
      const p1Gross = holeData.player1Gross
      const p2Gross = holeData.player2Gross
      const p3Gross = holeData.player3Gross
      const p4Gross = holeData.player4Gross

      if (!p1Gross || !p2Gross || !p3Gross || !p4Gross) continue

      const p1Net = calculateNetScore(p1Gross, allocation.team1Strokes)
      const p2Net = calculateNetScore(p2Gross, allocation.team1Strokes)
      const p3Net = calculateNetScore(p3Gross, allocation.team2Strokes)
      const p4Net = calculateNetScore(p4Gross, allocation.team2Strokes)

      const { winner } = calculateBestBall(p1Net, p2Net, p3Net, p4Net)

      if (winner === 1) team1HolesWon++
      else if (winner === 2) team2HolesWon++
      else tied++
    } else {
      // 1v1 scoring
      const p1Gross = holeData.player1Gross
      const p2Gross = holeData.player2Gross

      if (!p1Gross || !p2Gross) continue

      const p1Net = calculateNetScore(p1Gross, allocation.team1Strokes)
      const p2Net = calculateNetScore(p2Gross, allocation.team2Strokes)

      const winner = determineHoleWinner(p1Net, p2Net)

      if (winner === 1) team1HolesWon++
      else if (winner === 2) team2HolesWon++
      else tied++
    }
  }

  // Determine overall match winner
  let matchWinner: 0 | 1 | 2 = 0
  if (team1HolesWon > team2HolesWon) matchWinner = 1
  else if (team2HolesWon > team1HolesWon) matchWinner = 2

  return {
    team1HolesWon,
    team2HolesWon,
    tied,
    matchWinner,
    totalDrinks,
  }
}

/**
 * Calculates overall team standings from all matches
 */
export function calculateTeamStandings(
  matches: Match[],
  matchScores: Record<string, MatchScore>,
  holeAllocations: Record<string, HoleAllocation[]>,
  players: Player[],
): TeamStanding[] {
  const standings: Record<string, TeamStanding> = {}

  // Initialize standings for all teams
  const uniqueTeams = Array.from(new Set(players.map((p) => p.team)))
  for (const teamName of uniqueTeams) {
    standings[teamName] = {
      teamName,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
      drinkPoints: 0,
      matchesPlayed: 0,
    }
  }

  // Process each match
  for (const match of matches) {
    const matchScore = matchScores[match.id]
    const allocations = holeAllocations[match.id]

    if (!matchScore || !allocations) continue

    // Only count matches with at least one completed hole
    if (matchScore.completedHoles === 0) continue

    // Get team names for the players in this match
    const team1Player = players.find((p) => p.id === match.team1Players[0])
    const team2Player = players.find((p) => p.id === match.team2Players[0])

    if (!team1Player || !team2Player) continue

    const team1Name = team1Player.team
    const team2Name = team2Player.team

    const result = calculateMatchResult(matchScore, match, allocations)

    // Update standings
    standings[team1Name].matchesPlayed++
    standings[team2Name].matchesPlayed++

    // Award points (1 point per hole won)
    standings[team1Name].points += result.team1HolesWon
    standings[team2Name].points += result.team2HolesWon

    // Award drink points
    const drinkPointsPerTeam = result.totalDrinks / 2 // Split drinks between teams
    standings[team1Name].drinkPoints += Math.round(drinkPointsPerTeam)
    standings[team2Name].drinkPoints += Math.round(drinkPointsPerTeam)

    // Determine match winner
    if (result.matchWinner === 1) {
      standings[team1Name].wins++
      standings[team2Name].losses++
    } else if (result.matchWinner === 2) {
      standings[team2Name].wins++
      standings[team1Name].losses++
    } else {
      standings[team1Name].ties++
      standings[team2Name].ties++
    }
  }

  // Convert to array and sort by points (descending)
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.losses - b.losses
  })
}

/**
 * Calculates standings for the standings page with drinking mode separation
 */
export function calculateStandings(
  teams: Team[],
  matches: Match[],
  matchScores: Record<string, MatchScore>,
  participants: Participant[],
  rounds: Round[],
): StandingResult[] {
  const standings: Record<string, StandingResult> = {}

  // Initialize standings for all teams
  for (const team of teams) {
    standings[team.id] = {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
      drinkPoints: 0,
      netScore: 0,
      drinkingMode: false,
    }
  }

  // Process each match
  for (const match of matches) {
    const matchScore = matchScores[match.id]
    if (!matchScore || matchScore.completedHoles === 0) continue

    // Find round to check drinking mode
    const round = rounds.find((r) => r.id === match.roundId)
    const isDrinkingMode = round?.drinkingMode || false

    // Get teams for the players
    const team1Player = participants.find((p) => p.id === match.team1Players[0])
    const team2Player = participants.find((p) => p.id === match.team2Players[0])

    if (!team1Player || !team2Player) continue

    const team1 = teams.find((t) => t.name === team1Player.team)
    const team2 = teams.find((t) => t.name === team2Player.team)

    if (!team1 || !team2) continue

    // Count hole wins
    let team1HolesWon = 0
    let team2HolesWon = 0
    let totalDrinks = 0

    for (const hole of matchScore.holes) {
      if (match.format === "2v2") {
        if (!hole.player1Gross || !hole.player2Gross || !hole.player3Gross || !hole.player4Gross) continue
        const team1Best = Math.min(hole.player1Gross, hole.player2Gross)
        const team2Best = Math.min(hole.player3Gross, hole.player4Gross)

        if (team1Best < team2Best) team1HolesWon++
        else if (team2Best < team1Best) team2HolesWon++
      } else {
        if (!hole.player1Gross || !hole.player2Gross) continue
        if (hole.player1Gross < hole.player2Gross) team1HolesWon++
        else if (hole.player2Gross < hole.player1Gross) team2HolesWon++
      }

      totalDrinks += hole.drinks || 0
    }

    // Update standings based on drinking mode
    if (isDrinkingMode) {
      standings[team1.id].drinkingMode = true
      standings[team2.id].drinkingMode = true
      standings[team1.id].drinkPoints += Math.round(totalDrinks / 2)
      standings[team2.id].drinkPoints += Math.round(totalDrinks / 2)
    }

    standings[team1.id].points += team1HolesWon
    standings[team2.id].points += team2HolesWon

    // Determine match winner
    if (team1HolesWon > team2HolesWon) {
      standings[team1.id].wins++
      standings[team2.id].losses++
    } else if (team2HolesWon > team1HolesWon) {
      standings[team2.id].wins++
      standings[team1.id].losses++
    } else {
      standings[team1.id].ties++
      standings[team2.id].ties++
    }

    standings[team1.id].netScore += team1HolesWon - team2HolesWon
    standings[team2.id].netScore += team2HolesWon - team1HolesWon
  }

  // Convert to array and sort by total points
  return Object.values(standings).sort((a, b) => {
    const aTotal = a.points + a.drinkPoints
    const bTotal = b.points + b.drinkPoints
    if (bTotal !== aTotal) return bTotal - aTotal
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.losses - b.losses
  })
}
