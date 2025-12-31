"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Beer, Lock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  generateHoleStrokeAllocation,
  calculateNetScore,
  determineHoleWinner,
  calculateMatchPlayScore,
  calculateBestBallScore,
} from "@/lib/handicap-engine"
import { getVenueById, type Venue, type Hole } from "@/lib/venue-storage"
import { getPlayers } from "@/lib/player-storage"

export default function MatchScoringPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const matchId = params.matchId as string

  const { getTrip, getRounds, getMatches, getMatchScore, addMatchScore, updateHoleScore } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const matches = getMatches(roundId)
  const match = matches.find((m) => m.id === matchId)

  const [venue, setVenue] = useState<Venue | null>(null)
  const [venueHoles, setVenueHoles] = useState<Hole[]>([])
  const [selectedHole, setSelectedHole] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [existingScore, setExistingScore] = useState<any | null>(null)
  const [allMatchPlayers, setAllMatchPlayers] = useState<Array<{ id: string; name: string; handicap: number }>>([])

  useEffect(() => {
    console.log("[v0] Score page loaded with:", { tripId, roundId, matchId })
    console.log("[v0] Trip data:", trip)
    console.log("[v0] Round data:", round)
    console.log("[v0] All matches:", matches)
    console.log("[v0] Current match:", match)
  }, [tripId, roundId, matchId, trip, round, matches, match])

  useEffect(() => {
    if (trip?.venueId) {
      const loadedVenue = getVenueById(trip.venueId)
      if (loadedVenue) {
        setVenue(loadedVenue)
        setVenueHoles(loadedVenue.holes)
        console.log("[v0] Venue loaded:", loadedVenue)
        console.log("[v0] Venue holes:", loadedVenue.holes)
      } else {
        console.log("[v0] Venue not found for ID:", trip.venueId)
      }
    }
  }, [trip?.venueId])

  useEffect(() => {
    const existingMatchScore = getMatchScore(matchId)
    if (!existingMatchScore && venueHoles.length > 0) {
      // Create initial match score structure
      addMatchScore({
        matchId,
        holes: venueHoles.map((hole) => ({
          hole: hole.number,
          player1Gross: undefined,
          player2Gross: undefined,
          player3Gross: undefined,
          player4Gross: undefined,
          drinks: 0,
        })),
        completedHoles: 0,
      })
    }
    setExistingScore(existingMatchScore)
  }, [matchId, getMatchScore, addMatchScore, venueHoles])

  useEffect(() => {
    if (!trip || !match) {
      console.log("[v0] Missing trip or match:", { trip: !!trip, match: !!match })
      return
    }

    const allPlayers = getPlayers()
    console.log("[v0] === PLAYER LOADING DEBUG ===")
    console.log("[v0] All global players from localStorage:", allPlayers)
    console.log("[v0] Trip playersList:", trip.playersList)
    console.log("[v0] Match team1Players IDs:", match.team1Players)
    console.log("[v0] Match team2Players IDs:", match.team2Players)

    if (allPlayers.length === 0) {
      console.error("[v0] ERROR: No players found in localStorage! Players must be created first.")
    }
    if (!trip.playersList || trip.playersList.length === 0) {
      console.error("[v0] ERROR: No trip players found! Players must be added to the trip first.")
    }
    if (!match.team1Players || match.team1Players.length === 0) {
      console.error("[v0] ERROR: Match has no team1Players! Match may not have been created properly.")
    }

    const team1Players = match.team1Players
      .map((tripPlayerId) => {
        console.log("[v0] Looking for tripPlayer with ID:", tripPlayerId)
        const tripPlayer = trip.playersList.find((p) => p.id === tripPlayerId)
        console.log("[v0] Found tripPlayer:", tripPlayer)

        if (!tripPlayer) {
          console.error(
            "[v0] ERROR: TripPlayer not found for ID:",
            tripPlayerId,
            "Available trip player IDs:",
            trip.playersList.map((p) => p.id),
          )
          return null
        }

        const player = allPlayers.find((p) => p.id === tripPlayer.playerId)
        console.log("[v0] Found global player:", player)

        if (!player) {
          console.error(
            "[v0] ERROR: Global player not found for playerId:",
            tripPlayer.playerId,
            "Available player IDs:",
            allPlayers.map((p) => p.id),
          )
          return null
        }

        return { id: tripPlayer.id, name: player.name, handicap: player.handicapIndex }
      })
      .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

    const team2Players = match.team2Players
      .map((tripPlayerId) => {
        const tripPlayer = trip.playersList.find((p) => p.id === tripPlayerId)
        if (!tripPlayer) {
          console.error("[v0] ERROR: TripPlayer not found for ID:", tripPlayerId)
          return null
        }
        const player = allPlayers.find((p) => p.id === tripPlayer.playerId)
        if (!player) {
          console.error("[v0] ERROR: Global player not found for playerId:", tripPlayer.playerId)
          return null
        }
        return { id: tripPlayer.id, name: player.name, handicap: player.handicapIndex }
      })
      .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

    console.log("[v0] Final resolved team1Players:", team1Players)
    console.log("[v0] Final resolved team2Players:", team2Players)

    const combined = [...team1Players, ...team2Players]
    console.log("[v0] All match players combined:", combined)
    console.log("[v0] === END PLAYER LOADING DEBUG ===")
    setAllMatchPlayers(combined)
  }, [trip, match])

  useEffect(() => {
    if (selectedHole < 1) {
      setSelectedHole(1)
    }
  }, [selectedHole])

  const totalHoles = venueHoles.length || 18

  const isHoleComplete = (holeNumber: number): boolean => {
    const holeData = existingScore?.holes.find((h: { hole: number }) => h.hole === holeNumber)
    if (!holeData) return false

    const playersToCheck = match?.format === "2v2" ? 4 : 2
    const scores = [holeData.player1Gross, holeData.player2Gross, holeData.player3Gross, holeData.player4Gross].slice(
      0,
      playersToCheck,
    )

    return scores.every((score) => score !== undefined && score !== null)
  }

  const isHoleLocked = (holeNumber: number): boolean => {
    if (holeNumber === 1) return false
    return !isHoleComplete(holeNumber - 1)
  }

  if (!trip || !round || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Match not found</p>
        </main>
      </div>
    )
  }

  const matchScore = existingScore || {
    id: "",
    matchId,
    holes: venueHoles.map((hole) => ({
      hole: hole.number,
      player1Gross: undefined,
      player2Gross: undefined,
      player3Gross: undefined,
      player4Gross: undefined,
      drinks: 0,
    })),
    completedHoles: 0,
    createdAt: "",
    updatedAt: "",
  }

  const venueStrokeIndices = venueHoles.map((h: Hole) => h.handicap)

  const team1Players = allMatchPlayers.slice(0, match.format === "2v2" ? 2 : 1)
  const team2Players = allMatchPlayers.slice(match.format === "2v2" ? 2 : 1)

  const holeAllocations = generateHoleStrokeAllocation(
    team1Players,
    team2Players,
    match.format,
    venueStrokeIndices.length > 0 ? venueStrokeIndices : undefined,
  )

  const currentHole = matchScore.holes.find((h: { hole: number }) => h.hole === selectedHole)
  const currentVenueHole = venueHoles.find((h) => h.number === selectedHole)

  if (!currentHole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading hole data...</p>
        </div>
      </div>
    )
  }

  const handleScoreChange = (playerIndex: number, value: string) => {
    const score = value === "" ? undefined : Number.parseInt(value, 10)
    const field = `player${playerIndex + 1}Gross` as keyof typeof currentHole

    updateHoleScore(matchId, selectedHole, {
      [field]: score,
    })
  }

  const handleDrinkChange = (value: string) => {
    const drinks = value === "" ? 0 : Number.parseInt(value, 10)
    updateHoleScore(matchId, selectedHole, { drinks })
  }

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

        const winner = determineHoleWinner(p1Net, p2Net)

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
  const matchStatus = calculateMatchPlayScore(holeResults, totalHoles)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      router.push(`/trips/${tripId}?tab=rounds`)
    }, 500)
  }

  const currentAllocation = holeAllocations.find((a) => a.hole === selectedHole)!

  const currentHoleComplete = isHoleComplete(selectedHole)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}?tab=rounds`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rounds
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Scorecard</h1>
          <p className="text-muted-foreground">
            Round {round.number} - {round.course}
          </p>
          <p className="text-sm text-muted-foreground">
            {match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"} • {totalHoles} Holes
            {venue && ` • ${venue.name}`}
          </p>
        </div>

        {/* Match Status */}
        <Card className="border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Match Status</p>
                <p className="text-2xl font-bold text-primary">{matchStatus.currentStatus}</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">Team 1</p>
                  <p className="text-xl font-bold text-foreground">{matchStatus.team1HolesWon}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tied</p>
                  <p className="text-xl font-bold text-muted-foreground">{matchStatus.tied}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team 2</p>
                  <p className="text-xl font-bold text-foreground">{matchStatus.team2HolesWon}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hole Selector */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Hole</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
              {venueHoles.map((venueHole) => {
                const holeNumber = venueHole.number
                const complete = isHoleComplete(holeNumber)
                const locked = isHoleLocked(holeNumber)

                return (
                  <button
                    key={holeNumber}
                    onClick={() => !locked && setSelectedHole(holeNumber)}
                    disabled={locked}
                    className={`p-3 rounded-lg border text-center transition relative ${
                      selectedHole === holeNumber
                        ? "border-primary bg-primary text-primary-foreground"
                        : complete
                          ? "border-green-500 bg-green-500/10 text-green-600 hover:border-green-600"
                          : locked
                            ? "border-border/30 bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                            : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div className="font-semibold">{holeNumber}</div>
                    {complete && selectedHole !== holeNumber && (
                      <CheckCircle2 className="w-3 h-3 absolute top-1 right-1 text-green-600" />
                    )}
                    {locked && <Lock className="w-3 h-3 absolute top-1 right-1" />}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Complete all player scores in the current hole to unlock the next hole
            </p>
          </CardContent>
        </Card>

        {/* Score Entry */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Hole {selectedHole}
                  {currentHoleComplete && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentVenueHole && (
                    <>
                      Par {currentVenueHole.par} • Stroke Index: {currentAllocation.strokeIndex} •{" "}
                      <span className="capitalize">{currentVenueHole.complexity}</span>
                    </>
                  )}
                  {!currentVenueHole && <>Stroke Index: {currentAllocation.strokeIndex}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentAllocation.team1Strokes > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    Team 1: {currentAllocation.team1Strokes} stroke{currentAllocation.team1Strokes > 1 ? "s" : ""}
                  </span>
                )}
                {currentAllocation.team2Strokes > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium">
                    Team 2: {currentAllocation.team2Strokes} stroke{currentAllocation.team2Strokes > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Player Scores */}
            <div className="space-y-3">
              {allMatchPlayers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">Loading players...</p>
                  <p className="text-xs text-muted-foreground">Check browser console for debug information</p>
                </div>
              )}
              {allMatchPlayers.map((player, index) => {
                const field = `player${index + 1}Gross` as keyof typeof currentHole
                const grossScore = currentHole[field] as number | undefined
                const strokesReceived =
                  index < (match.format === "2v2" ? 2 : 1)
                    ? currentAllocation.team1Strokes
                    : currentAllocation.team2Strokes
                const netScore = grossScore ? calculateNetScore(grossScore, strokesReceived) : undefined

                return (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Handicap: {player.handicap} • Team {index < (match.format === "2v2" ? 2 : 1) ? "1" : "2"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Gross</label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          value={grossScore || ""}
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          className="w-16 text-center bg-background"
                          placeholder="-"
                        />
                      </div>
                      {netScore !== undefined && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Net</label>
                          <div className="w-16 h-10 rounded-lg border border-primary bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {netScore}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Drinks Counter */}
            {round.drinkingMode && (
              <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                <div className="flex items-center gap-3">
                  <Beer className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground block">Drinks on this hole</label>
                    <p className="text-xs text-muted-foreground">Track drinking points for this hole</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={currentHole.drinks || 0}
                    onChange={(e) => handleDrinkChange(e.target.value)}
                    className="w-20 text-center bg-background"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedHole(Math.max(1, selectedHole - 1))}
                disabled={selectedHole === 1}
                className="flex-1 bg-transparent"
              >
                Previous Hole
              </Button>
              <Button
                onClick={() => {
                  const nextHole = selectedHole + 1
                  if (nextHole <= totalHoles && !isHoleLocked(nextHole)) {
                    setSelectedHole(nextHole)
                  }
                }}
                disabled={selectedHole === totalHoles || !currentHoleComplete}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {!currentHoleComplete ? "Complete All Scores" : "Next Hole"}
              </Button>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2 bg-accent hover:bg-accent/90">
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save & Exit"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
