"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Users, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useMemo } from "react"

export default function ScoringPage() {
  const { trips, getRounds, getMatches, getMatchScore, getTrip } = useAuth()

  const allRoundsWithDetails = useMemo(() => {
    const roundsData: Array<{
      round: {
        id: string
        number: number
        course: string
        date: string
        status: "planned" | "completed"
        format?: "2v2" | "1v1"
        tripId: string
      }
      trip: {
        id: string
        name: string
        location: string
      }
      matches: Array<{
        id: string
        format: "2v2" | "1v1"
        team1Players: string[]
        team2Players: string[]
      }>
      participantNames: string[]
      completedMatches: number
      totalMatches: number
    }> = []

    trips.forEach((trip) => {
      const rounds = getRounds(trip.id)
      const tripDetails = getTrip(trip.id)

      rounds.forEach((round) => {
        const matches = getMatches(round.id)
        const participantIds = new Set<string>()

        matches.forEach((match) => {
          match.team1Players.forEach((id) => participantIds.add(id))
          match.team2Players.forEach((id) => participantIds.add(id))
        })

        const participantNames = Array.from(participantIds)
          .map((id) => tripDetails?.participantsList.find((p) => p.id === id)?.name)
          .filter(Boolean) as string[]

        let completedMatches = 0
        matches.forEach((match) => {
          const matchScore = getMatchScore(match.id)
          if (matchScore && matchScore.holes.some((h) => h.player1Gross && h.player1Gross > 0)) {
            completedMatches++
          }
        })

        roundsData.push({
          round,
          trip: {
            id: trip.id,
            name: trip.name,
            location: trip.location,
          },
          matches,
          participantNames,
          completedMatches,
          totalMatches: matches.length,
        })
      })
    })

    return roundsData
  }, [trips, getRounds, getMatches, getMatchScore, getTrip])

  const activeRounds = allRoundsWithDetails.filter((r) => r.round.status === "planned")
  const completedRounds = allRoundsWithDetails.filter((r) => r.round.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Scoring</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Enter and track match scores</p>
          </div>
          <Link href="/trips" className="w-full sm:w-auto">
            <Button variant="outline" className="bg-transparent gap-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-muted border border-border w-full">
            <TabsTrigger value="active" className="flex-1 text-xs sm:text-sm">
              Active ({activeRounds.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs sm:text-sm">
              Completed ({completedRounds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeRounds.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">No active rounds yet</p>
                    <Link href="/trips">
                      <Button className="bg-primary hover:bg-primary/90">Go to Trips</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              activeRounds.map((roundData) => (
                <Card
                  key={roundData.round.id}
                  className="border-border/50 hover:border-primary/50 transition overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{roundData.trip.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{roundData.trip.location}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-4 sm:pt-6">
                    <div className="space-y-4">
                      {/* Match Header */}
                      <div>
                        <h3 className="font-semibold text-foreground text-base sm:text-lg">
                          Round {roundData.round.number} - {roundData.round.course}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(roundData.round.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span>{roundData.round.format === "2v2" ? "2v2" : "1v1"}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            roundData.completedMatches === 0
                              ? "bg-primary/10 text-primary"
                              : roundData.completedMatches === roundData.totalMatches
                                ? "bg-accent/10 text-accent"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {roundData.completedMatches === 0
                            ? "Not Started"
                            : roundData.completedMatches === roundData.totalMatches
                              ? "Complete"
                              : `${roundData.completedMatches}/${roundData.totalMatches}`}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            Participants ({roundData.participantNames.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {roundData.participantNames.slice(0, 4).map((name, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md bg-background border border-border text-xs text-foreground truncate"
                            >
                              {name}
                            </span>
                          ))}
                          {roundData.participantNames.length > 4 && (
                            <span className="px-2 py-1 rounded-md bg-background border border-border text-xs text-muted-foreground">
                              +{roundData.participantNames.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matches Info */}
                      {roundData.totalMatches > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="w-4 h-4" />
                          <span>
                            {roundData.totalMatches} {roundData.totalMatches === 1 ? "Match" : "Matches"} in this round
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 sm:gap-3 pt-4 border-t border-border flex-col sm:flex-row">
                        <Link href={`/trips/${roundData.trip.id}?tab=rounds`} className="flex-1">
                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                        </Link>
                        {roundData.totalMatches > 0 && roundData.matches[0] && (
                          <Link
                            href={`/trips/${roundData.trip.id}/rounds/${roundData.round.id}/matches/${roundData.matches[0].id}/score`}
                            className="flex-1"
                          >
                            <Button className="w-full bg-primary hover:bg-primary/90">Enter Scores</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRounds.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No completed rounds yet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              completedRounds.map((roundData) => (
                <Card key={roundData.round.id} className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border/50 px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{roundData.trip.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{roundData.trip.location}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                            Round {roundData.round.number} - {roundData.round.course}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent whitespace-nowrap">
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          {new Date(roundData.round.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <Link href={`/trips/${roundData.trip.id}?tab=rounds`} className="w-full sm:w-auto">
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
