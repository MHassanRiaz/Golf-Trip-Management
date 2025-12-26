"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { calculatePlayerLeaderboard } from "@/lib/leaderboard-calculator"
import { Trophy, TrendingDown, Zap } from "lucide-react"
import { useState } from "react"

export default function LeaderboardPage() {
  const { trips, tripParticipants, tripRounds, roundMatches, matchScores } = useAuth()
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)

  // Calculate leaderboard for selected trip or all trips
  let leaderboard = []
  const activeTripId = selectedTrip || trips[0]?.id

  if (activeTripId) {
    const participants = tripParticipants[activeTripId] || []
    const rounds = tripRounds[activeTripId] || []
    const allMatches = rounds.flatMap((round) => roundMatches[round.id] || [])

    leaderboard = calculatePlayerLeaderboard(participants, allMatches, matchScores)
  }

  const topScorers = leaderboard.slice(0, 10)
  const bestAverage = leaderboard.reduce(
    (best, player) => (!best || player.averageScore < best.averageScore ? player : best),
    null,
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Player Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Individual scoring rankings across all rounds</p>
        </div>

        {/* Trip Selection */}
        {trips.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {trips.map((trip) => (
              <Button
                key={trip.id}
                variant={selectedTrip === trip.id ? "default" : "outline"}
                onClick={() => setSelectedTrip(trip.id)}
                className="text-sm"
              >
                {trip.name}
              </Button>
            ))}
          </div>
        )}

        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="bg-muted border border-border w-full sm:w-auto">
            <TabsTrigger value="overall" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Overall</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="streaks" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Streaks</span>
            </TabsTrigger>
          </TabsList>

          {/* Overall Leaderboard */}
          <TabsContent value="overall">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Top Scorers</CardTitle>
                <CardDescription>Players ranked by total gross score</CardDescription>
              </CardHeader>
              <CardContent>
                {topScorers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No player scores yet</div>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((player, index) => (
                      <div
                        key={player.participantId}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 transition"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          {/* Rank Badge */}
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-300 to-orange-600 text-white"
                                      : "bg-primary/10 text-primary"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>

                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                              {player.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{player.team}</p>
                          </div>

                          {/* Scores */}
                          <div className="flex gap-2 sm:gap-4 text-right text-xs sm:text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Gross</p>
                              <p className="font-bold text-primary">{player.grossTotal}</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="text-xs text-muted-foreground">Avg</p>
                              <p className="font-bold">{player.averageScore.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Holes</p>
                              <p className="font-bold text-accent">{player.holesCompleted}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Average Score */}
              {bestAverage && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Best Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-primary mb-2">{bestAverage.averageScore.toFixed(1)}</div>
                      <p className="text-lg font-semibold text-foreground">{bestAverage.name}</p>
                      <p className="text-sm text-muted-foreground">{bestAverage.team}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Most Holes Played */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Most Holes Played</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard
                      .sort((a, b) => b.holesCompleted - a.holesCompleted)
                      .slice(0, 3)
                      .map((player) => (
                        <div key={player.participantId} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{player.name}</span>
                          <span className="text-sm font-bold text-primary">{player.holesCompleted}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Best Single Hole */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Best Single Hole</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard
                      .filter((p) => p.bestHole > 0)
                      .sort((a, b) => a.bestHole - b.bestHole)
                      .slice(0, 3)
                      .map((player) => (
                        <div key={player.participantId} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{player.name}</span>
                          <span className="text-sm font-bold text-accent">{player.bestHole} strokes</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Worst Single Hole */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Worst Single Hole</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard
                      .filter((p) => p.worstHole > 0)
                      .sort((a, b) => b.worstHole - a.worstHole)
                      .slice(0, 3)
                      .map((player) => (
                        <div key={player.participantId} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{player.name}</span>
                          <span className="text-sm font-bold text-red-500">{player.worstHole} strokes</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Streaks and Achievements */}
          <TabsContent value="streaks">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Player Achievements</CardTitle>
                <CardDescription>Performance metrics and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Most Consistent</h5>
                    <div className="space-y-2">
                      {leaderboard
                        .filter((p) => p.bestHole > 0 && p.worstHole > 0)
                        .sort((a, b) => {
                          const aDiff = a.worstHole - a.bestHole
                          const bDiff = b.worstHole - b.bestHole
                          return aDiff - bDiff
                        })
                        .slice(0, 3)
                        .map((player) => {
                          const diff = player.worstHole - player.bestHole
                          return (
                            <div key={player.participantId} className="flex justify-between items-center">
                              <span className="text-sm">{player.name}</span>
                              <span className="text-sm font-bold">±{diff}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-sm mb-2">Most Matches Played</h5>
                    <div className="space-y-2">
                      {leaderboard
                        .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
                        .slice(0, 3)
                        .map((player) => (
                          <div key={player.participantId} className="flex justify-between items-center">
                            <span className="text-sm">{player.name}</span>
                            <span className="text-sm font-bold">{player.matchesPlayed} matches</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
