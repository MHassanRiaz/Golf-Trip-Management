"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Zap, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { generateAllMatchesForRound } from "@/lib/match-generator"

export default function GenerateMatchesPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const { getTrip, getRounds, getFoursomes, addMatch, getMatches } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const foursomes = getFoursomes(roundId)
  const existingMatches = getMatches(roundId)

  const [format, setFormat] = useState<"2v2" | "1v1">(round?.format || "2v2")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (!trip || !round) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip or round not found</p>
        </main>
      </div>
    )
  }

  const handleGenerate = () => {
    setError("")
    setSuccess("")

    if (foursomes.length === 0) {
      setError("No foursomes found for this round. Create foursomes first.")
      return
    }

    try {
      const matches = generateAllMatchesForRound(roundId, format, foursomes, trip.playersList)

      // Add all generated matches
      matches.forEach((match) => {
        addMatch(match)
      })

      setSuccess(`Successfully generated ${matches.length} match(es) from ${foursomes.length} foursome(s)`)
      setTimeout(() => {
        router.push(`/trips/${tripId}?tab=rounds`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate matches")
    }
  }

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

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Generate Matches</CardTitle>
                <CardDescription>
                  Round {round.number} - {round.course}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm flex items-start gap-2">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
              <h3 className="font-semibold text-foreground mb-3">Round Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Foursomes</p>
                  <p className="font-semibold text-foreground">{foursomes.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Players</p>
                  <p className="font-semibold text-foreground">{foursomes.length * 4}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Existing Matches</p>
                  <p className="font-semibold text-foreground">{existingMatches.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matches to Generate</p>
                  <p className="font-semibold text-primary">
                    {format === "2v2" ? foursomes.length : foursomes.length * 2}
                  </p>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Match Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("2v2")}
                  className={`p-4 rounded-lg border text-left transition ${
                    format === "2v2"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1">2v2 Best Ball</div>
                  <div className="text-xs text-muted-foreground">1 match per foursome</div>
                  <div className="text-xs text-muted-foreground mt-1">2 players vs 2 players</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("1v1")}
                  className={`p-4 rounded-lg border text-left transition ${
                    format === "1v1"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1">1v1 Singles</div>
                  <div className="text-xs text-muted-foreground">2 matches per foursome</div>
                  <div className="text-xs text-muted-foreground mt-1">Individual matchups</div>
                </button>
              </div>
            </div>

            {/* Foursomes Preview */}
            <div className="space-y-3">
              <Label>Foursomes to Process</Label>
              <div className="space-y-2">
                {foursomes.map((foursome) => {
                  const playerNames = foursome.players
                    .map((playerId: string) => trip.playersList.find((p) => p.id === playerId)?.name)
                    .filter(Boolean)

                  return (
                    <div key={foursome.id} className="p-3 rounded-lg border border-border bg-background">
                      <div className="font-medium text-foreground mb-2">{foursome.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {playerNames.map((name, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            {idx + 1}. {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href={`/trips/${tripId}?tab=rounds`} className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleGenerate} className="flex-1 bg-primary hover:bg-primary/90 gap-2">
                <Zap className="w-4 h-4" />
                Generate Matches
              </Button>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>2v2 Best Ball: Creates 1 match with teams of 2 players each</li>
                <li>1v1 Singles: Creates 2 separate matches with individual players</li>
                <li>A scorer is automatically assigned to each match</li>
                <li>Match handicaps will be calculated based on player handicaps</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
