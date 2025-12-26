"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams } from "next/navigation"
import { HandicapDisplay } from "@/components/handicap-display"

export default function MatchHandicapPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const matchId = params.matchId as string

  const { getTrip, getRounds, getMatches } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const matches = getMatches(roundId)
  const match = matches.find((m) => m.id === matchId)

  if (!trip || !round || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Match not found</p>
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}?tab=rounds`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rounds
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Match Handicap Calculator</h1>
          <p className="text-muted-foreground">
            Round {round.number} - {round.course}
          </p>
          <p className="text-sm text-muted-foreground">{match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}</p>
        </div>

        <HandicapDisplay team1Players={team1Players} team2Players={team2Players} format={match.format} />

        <div className="mt-6">
          <Link href={`/trips/${tripId}?tab=rounds`}>
            <Button className="w-full bg-primary hover:bg-primary/90">Done</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
