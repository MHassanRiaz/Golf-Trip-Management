"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Beer, Edit } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams } from "next/navigation"
import {
  generateHoleStrokeAllocation,
  calculateNetScore,
  calculateMatchPlayScore,
  calculateBestBallScore,
} from "@/lib/handicap-engine"

export default function MatchDetailsPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const matchId = params.matchId as string

  const { getTrip, getRounds, getMatches, getMatchScore } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const matches = getMatches(roundId)
  const match = matches.find((m) => m.id === matchId)
  const matchScore = getMatchScore(matchId)

  if (!trip || !round || !match || !matchScore) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Match details not found</p>
        </main>
      </div>
    )
  }

  const team1Players = match.team1Players
    .map((id) => trip.participantsList.find((p) => p.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

  const team2Players = match.team2Players
    .map((id) => trip.participantsList.find((p) => p.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

  const allPlayers = [...team1Players, ...team2Players]
  const holeAllocations = generateHoleStrokeAllocation(team1Players, team2Players, match.format)

  const calculateHoleResults = () => {
    const results: Array<{ hole: number; winner: 0 | 1 | 2; team1Net: number; team2Net: number }> = []

    for (const holeData of matchScore.holes) {
      const allocation = holeAllocations.find((a) => a.hole === holeData.hole)!

      if (match.format === "2v2") {
        const p1Gross = holeData.player1Gross || 0
        const p2Gross = holeData.player2Gross || 0
        const p3Gross = holeData.player3Gross || 0
        const p4Gross = holeData.player4Gross || 0

        if (p1Gross === 0 || p2Gross === 0 || p3Gross === 0 || p4Gross === 0) continue

        const p1Net = calculateNetScore(p1Gross, allocation.team1Strokes)
        const p2Net = calculateNetScore(p2Gross, allocation.team1Strokes)
        const p3Net = calculateNetScore(p3Gross, allocation.team2Strokes)
        const p4Net = calculateNetScore(p4Gross, allocation.team2Strokes)

        const { team1BestBall, team2BestBall, winner } = calculateBestBallScore(p1Net, p2Net, p3Net, p4Net)

        results.push({
          hole: holeData.hole,
          winner,
          team1Net: team1BestBall,
          team2Net: team2BestBall,
        })
      } else {
        const p1Gross = holeData.player1Gross || 0
        const p2Gross = holeData.player2Gross || 0

        if (p1Gross === 0 || p2Gross === 0) continue

        const p1Net = calculateNetScore(p1Gross, allocation.team1Strokes)
        const p2Net = calculateNetScore(p2Gross, allocation.team2Strokes)

        const winner = p1Net < p2Net ? 1 : p2Net < p1Net ? 2 : 0

        results.push({
          hole: holeData.hole,
          winner,
          team1Net: p1Net,
          team2Net: p2Net,
        })
      }
    }

    return results
  }

  const holeResults = calculateHoleResults()
  const matchStatus = calculateMatchPlayScore(holeResults)

  const getWinnerBadge = (winner: 0 | 1 | 2) => {
    if (winner === 1)
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
          T1 Won
        </Badge>
      )
    if (winner === 2)
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">T2 Won</Badge>
    return <Badge variant="outline">Tied</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}?tab=rounds`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rounds
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Match Details</h1>
            <p className="text-muted-foreground">
              Round {round.number} - {round.course}
            </p>
            <p className="text-sm text-muted-foreground">{match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}</p>
          </div>
          <Link href={`/trips/${tripId}/rounds/${roundId}/matches/${matchId}/score`}>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Edit className="w-4 h-4" />
              Edit Scorecard
            </Button>
          </Link>
        </div>

        {/* Match Status */}
        <Card className="border-border/40 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{matchStatus.currentStatus}</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Team 1 Won</p>
                  <p className="text-3xl font-bold text-emerald-600">{matchStatus.team1HolesWon}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tied</p>
                  <p className="text-3xl font-bold text-muted-foreground">{matchStatus.tied}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Team 2 Won</p>
                  <p className="text-3xl font-bold text-blue-600">{matchStatus.team2HolesWon}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Team 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {team1Players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40"
                >
                  <span className="font-medium text-foreground">{player.name}</span>
                  <Badge variant="outline">HCP: {player.handicap}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Team 2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {team2Players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40"
                >
                  <span className="font-medium text-foreground">{player.name}</span>
                  <Badge variant="outline">HCP: {player.handicap}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Hole-by-Hole Scorecard */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-xl">Hole-by-Hole Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchScore.holes.map((holeData) => {
                const allocation = holeAllocations.find((a) => a.hole === holeData.hole)!
                const result = holeResults.find((r) => r.hole === holeData.hole)

                const hasScores =
                  match.format === "2v2"
                    ? holeData.player1Gross && holeData.player2Gross && holeData.player3Gross && holeData.player4Gross
                    : holeData.player1Gross && holeData.player2Gross

                return (
                  <div
                    key={holeData.hole}
                    className={`p-4 rounded-lg border transition-all ${
                      hasScores
                        ? "border-border/60 bg-gradient-to-r from-card to-muted/20"
                        : "border-border/30 bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="font-bold text-primary">{holeData.hole}</span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Stroke Index: {allocation.strokeIndex}</p>
                          {result && (
                            <p className="text-sm font-medium text-foreground mt-1">
                              {result.team1Net} vs {result.team2Net}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {round.drinkingMode && holeData.drinks > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Beer className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-600">{holeData.drinks}</span>
                          </div>
                        )}
                        {result && getWinnerBadge(result.winner)}
                        {!hasScores && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not played
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
