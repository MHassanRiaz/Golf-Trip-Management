"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Beer } from "lucide-react"
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

const TOTAL_HOLES = 5
const AUTO_SAVE_INTERVAL = 5000 // Auto-save every 5 seconds
let autoSaveInProgress = false

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

  const [selectedHole, setSelectedHole] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [existingScore, setExistingScore] = useState<any | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<string>("Not saved yet")
  const [initialHoleLoaded, setInitialHoleLoaded] = useState(false)

  const team1Players = match?.team1Players
    .map((id) => trip?.participantsList.find((p) => p.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

  const team2Players = match?.team2Players
    .map((id) => trip?.participantsList.find((p) => p.id === id))
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number }>

  const allPlayers = [...team1Players, ...team2Players]

  const matchScore = existingScore || {
    id: "",
    matchId,
    holes: Array.from({ length: TOTAL_HOLES }, (_, i) => ({
      hole: i + 1,
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

  const holeAllocations = generateHoleStrokeAllocation(team1Players, team2Players, match?.format)
  const currentHole = matchScore.holes.find((h) => h.hole === selectedHole)!

  const isCurrentHoleComplete = () => {
    const numPlayers = match?.format === "2v2" ? 4 : 2
    const scores = [
      currentHole.player1Gross,
      currentHole.player2Gross,
      currentHole.player3Gross,
      currentHole.player4Gross,
    ].slice(0, numPlayers)

    return scores.every((score) => score !== undefined)
  }

  const canSelectHole = (hole: number) => {
    if (hole === 1) return true
    return matchScore.holes.slice(0, hole - 1).every((h) => {
      const numPlayers = match?.format === "2v2" ? 4 : 2
      const scores = [h.player1Gross, h.player2Gross, h.player3Gross, h.player4Gross].slice(0, numPlayers)
      return scores.every((score) => score !== undefined)
    })
  }

  const calculateHoleResults = () => {
    const results: Array<{ hole: number; winner: 0 | 1 | 2; team1Net: number; team2Net: number }> = []

    for (const holeData of matchScore.holes) {
      const allocation = holeAllocations.find((a) => a.hole === holeData.hole)!

      if (match?.format === "2v2") {
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
  const matchStatus = calculateMatchPlayScore(holeResults)

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

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      router.push(`/trips/${tripId}?tab=rounds`)
    }, 500)
  }

  const currentAllocation = holeAllocations.find((a) => a.hole === selectedHole)!

  useEffect(() => {
    setExistingScore(getMatchScore(matchId))
  }, [matchId, getMatchScore])

  useEffect(() => {
    if (existingScore && !initialHoleLoaded) {
      // Find the first hole that doesn't have all player scores
      let nextIncompleteHole = 1
      for (let i = 0; i < existingScore.holes.length; i++) {
        const hole = existingScore.holes[i]
        const numPlayers = match?.format === "2v2" ? 4 : 2
        const scores = [hole.player1Gross, hole.player2Gross, hole.player3Gross, hole.player4Gross].slice(0, numPlayers)

        const isComplete = scores.every((s) => s !== undefined)
        if (!isComplete) {
          nextIncompleteHole = i + 1
          break
        }
      }

      // If all holes complete, stay at last hole
      if (nextIncompleteHole === existingScore.holes.length + 1) {
        nextIncompleteHole = TOTAL_HOLES
      }

      console.log("[v0] Setting initial hole to:", nextIncompleteHole)
      setSelectedHole(nextIncompleteHole)
      setInitialHoleLoaded(true)
    }
  }, [existingScore, match?.format, initialHoleLoaded])

  useEffect(() => {
    const autoSaveTimer = setInterval(async () => {
      if (existingScore && !autoSaveInProgress) {
        autoSaveInProgress = true
        try {
          const response = await fetch(`/api/matches/${matchId}/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              holes: existingScore.holes.map((hole) => ({
                hole: hole.hole,
                player1Gross: hole.player1Gross,
                player2Gross: hole.player2Gross,
                player3Gross: hole.player3Gross,
                player4Gross: hole.player4Gross,
                drinks: hole.drinks,
              })),
              completedHoles: existingScore.completedHoles,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            console.log("[v0] Auto-saved scores to backend:", data)
            setLastSaveTime(new Date().toLocaleTimeString())
          } else {
            console.error("[v0] Backend save failed:", response.statusText)
          }
        } catch (error) {
          console.error("[v0] Auto-save API error:", error)
        } finally {
          autoSaveInProgress = false
        }
      }
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(autoSaveTimer)
  }, [existingScore, matchId])

  useEffect(() => {
    if (!existingScore) {
      const initialHoles = Array.from({ length: TOTAL_HOLES }, (_, i) => ({
        hole: i + 1,
        player1Gross: undefined,
        player2Gross: undefined,
        player3Gross: undefined,
        player4Gross: undefined,
        drinks: 0,
      }))

      addMatchScore({
        matchId,
        holes: initialHoles,
        completedHoles: 0,
      })
    }
  }, [matchId, existingScore, addMatchScore])

  useEffect(() => {
    if (isCurrentHoleComplete() && selectedHole < TOTAL_HOLES) {
      const timer = setTimeout(() => {
        setSelectedHole(selectedHole + 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [selectedHole, matchScore.holes])

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
          <p className="text-sm text-muted-foreground">{match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}</p>
        </div>

        <Card className="border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Match Status</p>
                <p className="text-2xl font-bold text-primary">{matchStatus.currentStatus}</p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-right w-full sm:w-auto">
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
            <p className="text-xs text-muted-foreground mt-4">Last auto-save: {lastSaveTime}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Select Hole (Sequential Entry)</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Complete all players on current hole to unlock next
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {Array.from({ length: TOTAL_HOLES }, (_, i) => i + 1).map((hole) => {
                const holeData = matchScore.holes.find((h) => h.hole === hole)!
                const numPlayers = match.format === "2v2" ? 4 : 2
                const scores = [
                  holeData.player1Gross,
                  holeData.player2Gross,
                  holeData.player3Gross,
                  holeData.player4Gross,
                ].slice(0, numPlayers)
                const hasScore = scores.some((s) => s !== undefined)
                const isComplete = scores.every((s) => s !== undefined)
                const isSelectable = canSelectHole(hole)

                return (
                  <button
                    key={hole}
                    onClick={() => isSelectable && setSelectedHole(hole)}
                    disabled={!isSelectable}
                    className={`p-2 sm:p-3 rounded-lg border text-center transition text-xs sm:text-sm ${
                      !isSelectable
                        ? "border-border/30 bg-background text-muted-foreground/50 cursor-not-allowed opacity-50"
                        : selectedHole === hole
                          ? "border-primary bg-primary text-primary-foreground"
                          : isComplete
                            ? "border-accent bg-accent/10 text-accent hover:border-accent/70"
                            : hasScore
                              ? "border-primary/40 bg-primary/5 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div className="font-semibold">{hole}</div>
                    <div className="text-xs mt-0.5">{isComplete ? "✓" : hasScore ? "•" : "-"}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Hole {selectedHole}</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Stroke Index: {currentAllocation.strokeIndex}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {currentAllocation.team1Strokes > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium whitespace-nowrap">
                    Team 1: {currentAllocation.team1Strokes}
                  </span>
                )}
                {currentAllocation.team2Strokes > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium whitespace-nowrap">
                    Team 2: {currentAllocation.team2Strokes}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              {allPlayers.map((player, index) => {
                const field = `player${index + 1}Gross` as keyof typeof currentHole
                const grossScore = currentHole[field] as number | undefined
                const strokesReceived = index < 2 ? currentAllocation.team1Strokes : currentAllocation.team2Strokes
                const netScore = grossScore ? calculateNetScore(grossScore, strokesReceived) : undefined

                return (
                  <div
                    key={player.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        HCP: {player.handicap} • Team {index < 2 ? "1" : "2"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none">
                        <label className="text-xs text-muted-foreground block mb-1">Gross</label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          value={grossScore || ""}
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          className="w-full sm:w-16 text-center bg-background text-sm"
                          placeholder="-"
                        />
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <label className="text-xs text-muted-foreground block mb-1">Net</label>
                        {netScore !== undefined ? (
                          <div className="w-full sm:w-16 h-9 sm:h-10 rounded-lg border border-primary bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                            {netScore}
                          </div>
                        ) : (
                          <div className="w-full sm:w-16 h-9 sm:h-10 rounded-lg border border-border/30 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                            -
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {round.drinkingMode && (
              <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Beer className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium text-foreground block">Drinks</label>
                    <p className="text-xs text-muted-foreground">Track drinking points</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={currentHole.drinks || 0}
                    onChange={(e) => handleDrinkChange(e.target.value)}
                    className="w-16 text-center bg-background text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedHole(Math.max(1, selectedHole - 1))}
                disabled={selectedHole === 1}
                className="flex-1 bg-transparent"
              >
                Previous
              </Button>
              {!isCurrentHoleComplete() && (
                <div className="flex-1 flex items-center justify-center p-2 rounded-lg border border-amber-200/50 bg-amber-50/30 text-xs">
                  <p className="text-amber-900/70 font-medium">Complete all players</p>
                </div>
              )}
              {isCurrentHoleComplete() && (
                <Button
                  onClick={() => setSelectedHole(Math.min(TOTAL_HOLES, selectedHole + 1))}
                  disabled={selectedHole === TOTAL_HOLES}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {selectedHole === TOTAL_HOLES ? "All Complete" : "Next"}
                </Button>
              )}
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
