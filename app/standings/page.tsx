"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { calculateStandings } from "@/lib/standings-calculator"
import { Beer, Trophy } from "lucide-react"

export default function StandingsPage() {
  const { trips, tripParticipants, tripRounds, tripTeams, roundMatches, matchScores } = useAuth()

  const allStandings = trips.flatMap((trip) => {
    const participants = tripParticipants[trip.id] || []
    const rounds = tripRounds[trip.id] || []
    const teams = tripTeams[trip.id] || []

    const allMatches = rounds.flatMap((round) => roundMatches[round.id] || [])

    return calculateStandings(teams, allMatches, matchScores, participants, rounds)
  })

  const regularStandings = allStandings.filter((s) => !s.drinkingMode)
  const drinkingStandings = allStandings.filter((s) => s.drinkingMode)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Standings & Results</h1>
          <p className="text-muted-foreground mt-1">Tournament Leaderboards</p>
        </div>

        <Tabs defaultValue="regular" className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="regular" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Regular Standings</span>
              <span className="sm:hidden">Regular</span>
            </TabsTrigger>
            <TabsTrigger value="drinking" className="gap-2">
              <Beer className="w-4 h-4" />
              <span className="hidden sm:inline">Drinking Mode</span>
              <span className="sm:hidden">Drinking</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regular">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Regular Team Standings</CardTitle>
                <CardDescription>Overall tournament standings (non-drinking rounds)</CardDescription>
              </CardHeader>
              <CardContent>
                {regularStandings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No regular standings data available yet</div>
                ) : (
                  <div className="space-y-3">
                    {regularStandings.map((standing, index) => (
                      <div
                        key={standing.teamId}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 transition"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
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

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{standing.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {standing.wins}W - {standing.losses}L
                            </p>
                          </div>

                          <div className="flex gap-3 text-right text-sm sm:text-base">
                            <div>
                              <p className="text-xs text-muted-foreground">Pts</p>
                              <p className="font-bold text-primary">{standing.points}</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="text-xs text-muted-foreground">Net</p>
                              <p className={`font-bold ${standing.netScore < 0 ? "text-green-500" : "text-red-500"}`}>
                                {standing.netScore > 0 ? "+" : ""}
                                {standing.netScore}
                              </p>
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

          <TabsContent value="drinking">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Drinking Mode Standings</CardTitle>
                <CardDescription>Standings with drinking points included</CardDescription>
              </CardHeader>
              <CardContent>
                {drinkingStandings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No drinking mode rounds played yet</div>
                ) : (
                  <div className="space-y-3">
                    {drinkingStandings.map((standing, index) => (
                      <div
                        key={standing.teamId}
                        className="p-4 rounded-lg border border-border hover:border-accent/50 transition"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-300 to-orange-600 text-white"
                                      : "bg-accent/10 text-accent"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{standing.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {standing.wins}W - {standing.losses}L
                            </p>
                          </div>

                          <div className="flex gap-2 text-right text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Pts</p>
                              <p className="font-bold text-primary">{standing.points}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Dr</p>
                              <p className="font-bold text-accent">{standing.drinkPoints}</p>
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
        </Tabs>
      </main>
    </div>
  )
}
