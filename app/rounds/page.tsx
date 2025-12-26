"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MapPin, Calendar, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

export default function RoundsPage() {
  const { trips, participants, foursomes } = useAuth()
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")

  const trip = trips.find((t) => t.id === tripId)

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Trip not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const rounds = trip.roundsList || []
  const tripFoursomes = foursomes.filter((f) => rounds.some((r) => r.id === f.roundId))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trip
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{trip.name} - Rounds</h1>
            <p className="text-muted-foreground mt-1 text-sm">Round Schedule & Foursomes</p>
          </div>
          <Link href={`/trips/${tripId}/rounds/new`} className="w-full sm:w-auto">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add Round
            </Button>
          </Link>
        </div>

        {rounds.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No rounds created yet</p>
              <Link href={`/trips/${tripId}/rounds/new`}>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Round
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {rounds.map((round) => {
                const roundFoursomes = tripFoursomes.filter((f) => f.roundId === round.id)
                return (
                  <Link key={round.id} href={`#round-${round.id}`}>
                    <Card className="border-border/50 hover:border-primary/50 h-full transition cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-foreground">Round {round.number}</h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                round.status === "completed" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                              }`}
                            >
                              {round.status === "completed" ? "Done" : "Planned"}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="truncate">{round.course}</span>
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{new Date(round.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{roundFoursomes.length} foursomes</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              {round.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"} • {round.teeBox}
                              {round.drinkingMode && " • Drinks"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Foursomes Details */}
            <Tabs defaultValue={`round-${rounds[0]?.id}`} className="space-y-6">
              <TabsList className="bg-muted border border-border w-full overflow-x-auto">
                {rounds.map((round) => (
                  <TabsTrigger key={round.id} value={`round-${round.id}`} className="text-xs sm:text-sm">
                    Round {round.number}
                  </TabsTrigger>
                ))}
              </TabsList>

              {rounds.map((round) => {
                const roundFoursomes = tripFoursomes.filter((f) => f.roundId === round.id)

                return (
                  <TabsContent key={round.id} value={`round-${round.id}`}>
                    <div className="space-y-4">
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle>Foursomes - Round {round.number}</CardTitle>
                          <CardDescription>
                            {round.course} • {new Date(round.date).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {roundFoursomes.length === 0 ? (
                        <Card className="border-border/50">
                          <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground mb-3">No foursomes created yet</p>
                            <Link href={`/trips/${tripId}/rounds/${round.id}/foursomes/new`}>
                              <Button variant="outline" className="gap-2 bg-transparent">
                                <Plus className="w-4 h-4" />
                                Create Foursome
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ) : (
                        roundFoursomes.map((foursome) => {
                          const playerNames = foursome.players
                            .map((playerId) => participants.find((p) => p.id === playerId))
                            .filter(Boolean)

                          return (
                            <Card key={foursome.id} className="border-border/50">
                              <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                                  <h4 className="font-semibold text-foreground">{foursome.name}</h4>
                                  {foursome.teeTime && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      Tee: {foursome.teeTime}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {playerNames.map((player, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                                    >
                                      <div className="min-w-0">
                                        <p className="font-medium text-foreground truncate">{player?.name}</p>
                                        <p className="text-xs text-muted-foreground">HCP: {player?.handicap}</p>
                                      </div>
                                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ml-2">
                                        <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
