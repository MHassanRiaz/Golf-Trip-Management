"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

function getStatusColor(status: string) {
  const colors = {
    active: "bg-accent/10 text-accent border border-accent/30",
    upcoming: "bg-primary/10 text-primary border border-primary/30",
    completed: "bg-muted text-muted-foreground border border-border",
  }
  return colors[status as keyof typeof colors] || colors.active
}

export default function TripsPage() {
  const { trips, tripParticipants, tripRounds, matchScores, roundMatches } = useAuth()

  const tripsWithData = trips.map((trip) => {
    const participants = tripParticipants[trip.id] || []
    const rounds = tripRounds[trip.id] || []

    // Calculate completed rounds based on match scores
    let completedRounds = 0
    rounds.forEach((round) => {
      const matches = roundMatches[round.id] || []
      const allMatchesCompleted =
        matches.length > 0 &&
        matches.every((match) => {
          const score = matchScores[match.id]
          // return score?.status === "completed"
        })
      if (allMatchesCompleted) {
        completedRounds++
      }
    })

    return {
      id: trip.id,
      name: trip.name,
      location: trip.location,
      status: trip.status,
      participants: participants.length,
      rounds: rounds.length,
      startDate: new Date(trip.startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      progress: completedRounds,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trips</h1>
            <p className="text-muted-foreground mt-1">All your golf trips</p>
          </div>
          <Link href="/trips/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create Trip
            </Button>
          </Link>
        </div>

        {tripsWithData.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first golf trip to start managing tournaments, scoring, and expenses.
                </p>
                <Link href="/trips/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Trip
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripsWithData.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="border-border/50 hover:border-primary/50 h-full transition cursor-pointer hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground line-clamp-2">{trip.name}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(trip.status)}`}
                          >
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {trip.location}
                        </p>
                      </div>

                      {/* Progress */}
                      {trip.status !== "upcoming" && trip.rounds > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-semibold text-foreground">
                              {trip.progress}/{trip.rounds} rounds
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                              style={{ width: `${trip.rounds > 0 ? (trip.progress / trip.rounds) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Participants
                          </p>
                          <p className="text-sm font-semibold text-foreground">{trip.participants}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Start Date
                          </p>
                          <p className="text-sm font-semibold text-foreground">{trip.startDate}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
