import type { Participant, Match, MatchScore } from "@/lib/auth-context"

export interface PlayerScore {
  participantId: string
  name: string
  team: string
  totalScore: number
  grossTotal: number
  netTotal: number
  holesCompleted: number
  matchesPlayed: number
  bestHole: number
  worstHole: number
  averageScore: number
  drinkPoints: number
  ranking: number
}

/**
 * Calculates individual player leaderboard from all matches
 */
export function calculatePlayerLeaderboard(
  participants: Participant[],
  matches: Match[],
  matchScores: Record<string, MatchScore>,
): PlayerScore[] {
  const playerScores: Record<string, Omit<PlayerScore, "ranking">> = {}

  // Initialize player scores
  for (const participant of participants) {
    playerScores[participant.id] = {
      participantId: participant.id,
      name: participant.name,
      team: participant.team,
      totalScore: 0,
      grossTotal: 0,
      netTotal: 0,
      holesCompleted: 0,
      matchesPlayed: 0,
      bestHole: Number.POSITIVE_INFINITY,
      worstHole: Number.NEGATIVE_INFINITY,
      averageScore: 0,
      drinkPoints: 0,
    }
  }

  // Process each match
  for (const match of matches) {
    const matchScore = matchScores[match.id]
    if (!matchScore || matchScore.completedHoles === 0) continue

    // Determine which participants are in this match
    const matchParticipants = participants.filter(
      (p) => match.team1Players.includes(p.id) || match.team2Players.includes(p.id),
    )

    for (const participant of matchParticipants) {
      if (!playerScores[participant.id]) continue

      playerScores[participant.id].matchesPlayed++
      let playerMatchScore = 0
      let playerGrossScore = 0
      const playerNetScore = 0
      let playerBestHole = Number.POSITIVE_INFINITY
      let playerWorstHole = Number.NEGATIVE_INFINITY

      for (const hole of matchScore.holes) {
        let playerGross: number | undefined

        // Determine which player slot this participant occupies
        if (match.format === "2v2") {
          const playerIndex = [...match.team1Players, ...match.team2Players].indexOf(participant.id)
          if (playerIndex === 0) playerGross = hole.player1Gross
          else if (playerIndex === 1) playerGross = hole.player2Gross
          else if (playerIndex === 2) playerGross = hole.player3Gross
          else if (playerIndex === 3) playerGross = hole.player4Gross
        } else {
          // 1v1 format
          if (match.team1Players.includes(participant.id)) {
            playerGross = hole.player1Gross
          } else {
            playerGross = hole.player2Gross
          }
        }

        if (playerGross) {
          playerGrossScore += playerGross
          playerMatchScore += playerGross
          playerBestHole = Math.min(playerBestHole, playerGross)
          playerWorstHole = Math.max(playerWorstHole, playerGross)
          playerScores[participant.id].holesCompleted++
        }
      }

      // Add drinks to score if applicable
      if (matchScore.holes[0]?.drinks) {
        playerScores[participant.id].drinkPoints += matchScore.holes[0].drinks
      }

      playerScores[participant.id].grossTotal += playerGrossScore
      playerScores[participant.id].totalScore += playerMatchScore
      playerScores[participant.id].netTotal += playerNetScore

      if (playerBestHole !== Number.POSITIVE_INFINITY) {
        playerScores[participant.id].bestHole = Math.min(playerScores[participant.id].bestHole, playerBestHole)
      }
      if (playerWorstHole !== Number.NEGATIVE_INFINITY) {
        playerScores[participant.id].worstHole = Math.max(playerScores[participant.id].worstHole, playerWorstHole)
      }
    }
  }

  // Calculate averages and add rankings
  const playerArray: PlayerScore[] = Object.values(playerScores).map((player, index) => ({
    ...player,
    averageScore: player.holesCompleted > 0 ? Math.round((player.grossTotal / player.holesCompleted) * 100) / 100 : 0,
    bestHole: player.bestHole === Number.POSITIVE_INFINITY ? 0 : player.bestHole,
    worstHole: player.worstHole === Number.NEGATIVE_INFINITY ? 0 : player.worstHole,
    ranking: index + 1,
  }))

  // Sort by total score (ascending - lower is better in golf)
  return playerArray
    .sort((a, b) => {
      if (a.grossTotal !== b.grossTotal) return a.grossTotal - b.grossTotal
      if (a.matchesPlayed !== b.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
      return a.drinkPoints - b.drinkPoints
    })
    .map((player, index) => ({ ...player, ranking: index + 1 }))
}
