"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Zap, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { getPlayers } from "@/lib/player-storage"

export default function GenerateMatchesPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const { getTrip, getRounds, addMatch, addFoursome, getTeams } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const allPlayers = getPlayers()
  const teams = getTeams(tripId)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const tripPlayers = trip?.playersList || []

  // Get team IDs from round
  const roundTeamIds = round?.teamIds || []

  // Get team names for display
  const teamAInfo = teams.find((t) => roundTeamIds.includes(t.id) && t.name.includes("Team A"))
  const teamBInfo = teams.find((t) => roundTeamIds.includes(t.id) && t.name.includes("Team B"))

  // Filter players by team assignment and map to full player details
  const teamAPlayers = tripPlayers
    .filter((tp) => tp.team === teamAInfo?.id)
    .map((tp) => {
      const player = allPlayers.find((p) => p.id === tp.playerId)
      return player ? { ...player, tripPlayerId: tp.id, handicap: player.handicapIndex } : null
    })
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number; tripPlayerId: string }>

  const teamBPlayers = tripPlayers
    .filter((tp) => tp.team === teamBInfo?.id)
    .map((tp) => {
      const player = allPlayers.find((p) => p.id === tp.playerId)
      return player ? { ...player, tripPlayerId: tp.id, handicap: player.handicapIndex } : null
    })
    .filter(Boolean) as Array<{ id: string; name: string; handicap: number; tripPlayerId: string }>

  // Track players selected for matches
  const [teamASelected, setTeamASelected] = useState<string[]>([]) // Column 2 - stores tripPlayerIds
  const [teamBSelected, setTeamBSelected] = useState<string[]>([]) // Column 3 - stores tripPlayerIds
  const [generatedMatches, setGeneratedMatches] = useState<Array<{ teamA: string[]; teamB: string[] }>>([])

  if (!trip || !round) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip or round not found</p>
        </main>
      </div>
    )
  }

  const playersPerTeam = round.format === "2v2" ? 2 : 1

  // Handle player selection from Team A (Column 1 -> Column 2)
  const selectTeamAPlayer = (tripPlayerId: string) => {
    if (teamASelected.includes(tripPlayerId)) return

    const newTeamASelected = [...teamASelected, tripPlayerId]
    setTeamASelected(newTeamASelected)

    // Check if we can generate a match
    if (newTeamASelected.length === playersPerTeam && teamBSelected.length === playersPerTeam) {
      generateMatch(newTeamASelected, teamBSelected)
    }
  }

  // Handle player selection from Team B (Column 4 -> Column 3)
  const selectTeamBPlayer = (tripPlayerId: string) => {
    if (teamBSelected.includes(tripPlayerId)) return

    const newTeamBSelected = [...teamBSelected, tripPlayerId]
    setTeamBSelected(newTeamBSelected)

    // Check if we can generate a match
    if (teamASelected.length === playersPerTeam && newTeamBSelected.length === playersPerTeam) {
      generateMatch(teamASelected, newTeamBSelected)
    }
  }

  // Generate a match and reset selection
  const generateMatch = (teamAPlayers: string[], teamBPlayers: string[]) => {
    setGeneratedMatches([...generatedMatches, { teamA: [...teamAPlayers], teamB: [...teamBPlayers] }])
    setTeamASelected([])
    setTeamBSelected([])
  }

  // Remove player from column 2/3 (move back to column 1/4)
  const removeTeamAPlayer = (tripPlayerId: string) => {
    setTeamASelected(teamASelected.filter((id) => id !== tripPlayerId))
  }

  const removeTeamBPlayer = (tripPlayerId: string) => {
    setTeamBSelected(teamBSelected.filter((id) => id !== tripPlayerId))
  }

  // Remove a generated match
  const removeMatch = (index: number) => {
    setGeneratedMatches(generatedMatches.filter((_, i) => i !== index))
  }

  // Get available players (not already in a match or selected)
  const usedPlayerIds = [
    ...generatedMatches.flatMap((m) => [...m.teamA, ...m.teamB]),
    ...teamASelected,
    ...teamBSelected,
  ]
  const availableTeamA = teamAPlayers.filter((p) => !usedPlayerIds.includes(p.tripPlayerId))
  const availableTeamB = teamBPlayers.filter((p) => !usedPlayerIds.includes(p.tripPlayerId))

  // Save matches and create foursomes
  const handleSave = () => {
    if (generatedMatches.length === 0) {
      setError("Please generate at least one match")
      return
    }

    if (round.format === "1v1") {
      // For 1v1: Create foursomes with 2 matches each
      for (let i = 0; i < generatedMatches.length; i += 2) {
        const foursomeId = `foursome-${roundId}-${Math.floor(i / 2) + 1}-${Date.now()}`
        const match1 = generatedMatches[i]
        const match2 = generatedMatches[i + 1]

        // Collect all players for this foursome
        const foursomePlayers = [...match1.teamA, ...match1.teamB]
        if (match2) {
          foursomePlayers.push(...match2.teamA, ...match2.teamB)
        }

        addFoursome(roundId, {
          name: `Foursome ${Math.floor(i / 2) + 1}`,
          players: foursomePlayers,
        })

        // Create first match
        addMatch({
          roundId,
          foursomeId: foursomeId,
          format: round!.format!,
          team1Players: match1.teamA,
          team2Players: match1.teamB,
          scorer: match1.teamA[0],
          status: "planned",
        })

        // Create second match if exists
        if (match2) {
          addMatch({
            roundId,
            foursomeId: foursomeId,
            format: round!.format!,
            team1Players: match2.teamA,
            team2Players: match2.teamB,
            scorer: match2.teamA[0],
            status: "planned",
          })
        }
      }
    } else {
      // For 2v2: Create 1 match per foursome
      generatedMatches.forEach((match, index) => {
        const foursomeId = `foursome-${roundId}-${index + 1}-${Date.now()}`

        addFoursome(roundId, {
          name: `Foursome ${index + 1}`,
          players: [...match.teamA, ...match.teamB],
        })

        addMatch({
          roundId,
          foursomeId: foursomeId,
          format: round!.format!,
          team1Players: match.teamA,
          team2Players: match.teamB,
          scorer: match.teamA[0],
          status: "planned",
        })
      })
    }

    const foursomeCount = round.format === "1v1" ? Math.ceil(generatedMatches.length / 2) : generatedMatches.length
    setSuccess(`Successfully generated ${generatedMatches.length} match(es) in ${foursomeCount} foursome(s)!`)
    setTimeout(() => {
      router.push(`/trips/${tripId}?tab=rounds`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}?tab=rounds`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rounds
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Generate Matches</h1>
            <p className="text-muted-foreground mt-1">
              Round {round.number} - {round.course}
            </p>
            <p className="text-sm text-muted-foreground">
              Format: {round.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Info Card */}
        <Card className="mb-6 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">How it works</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Select {playersPerTeam} player(s) from Team A (Column 1 → Column 2)</li>
                  <li>• Select {playersPerTeam} player(s) from Team B (Column 4 → Column 3)</li>
                  <li>• A match is automatically generated when both teams have {playersPerTeam} player(s)</li>
                  <li>
                    • Foursome #{generatedMatches.length + 1} will be auto-created for{" "}
                    {round.format === "2v2" ? "1 match (2v2)" : "next 2 matches (1v1 each)"}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4-Column Match Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Column 1: Team A Available Players */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Team A
              </CardTitle>
              <CardDescription className="text-xs">Click to select</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableTeamA.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All players used</p>
              ) : (
                availableTeamA.map((player) => (
                  <button
                    key={player.tripPlayerId}
                    onClick={() => selectTeamAPlayer(player.tripPlayerId)}
                    className="w-full p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-500/10 transition text-left"
                  >
                    <div className="font-medium text-sm text-foreground">{player.name}</div>
                    <div className="text-xs text-muted-foreground">HCP: {player.handicap}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Column 2: Team A Selected */}
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-base">Team A Selected</CardTitle>
              <CardDescription className="text-xs">
                {teamASelected.length}/{playersPerTeam}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamASelected.map((tripPlayerId) => {
                const player = teamAPlayers.find((p) => p.tripPlayerId === tripPlayerId)
                return (
                  <div
                    key={tripPlayerId}
                    className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 relative group"
                  >
                    <div className="font-medium text-sm text-foreground">{player?.name}</div>
                    <div className="text-xs text-muted-foreground">HCP: {player?.handicap}</div>
                    <button
                      onClick={() => removeTeamAPlayer(tripPlayerId)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-destructive/80 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              {teamASelected.length < playersPerTeam && (
                <div className="p-3 rounded-lg border-2 border-dashed border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Select {playersPerTeam - teamASelected.length} more</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Team B Selected */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-base">Team B Selected</CardTitle>
              <CardDescription className="text-xs">
                {teamBSelected.length}/{playersPerTeam}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamBSelected.map((tripPlayerId) => {
                const player = teamBPlayers.find((p) => p.tripPlayerId === tripPlayerId)
                return (
                  <div
                    key={tripPlayerId}
                    className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 relative group"
                  >
                    <div className="font-medium text-sm text-foreground">{player?.name}</div>
                    <div className="text-xs text-muted-foreground">HCP: {player?.handicap}</div>
                    <button
                      onClick={() => removeTeamBPlayer(tripPlayerId)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-destructive/80 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              {teamBSelected.length < playersPerTeam && (
                <div className="p-3 rounded-lg border-2 border-dashed border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Select {playersPerTeam - teamBSelected.length} more</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 4: Team B Available Players */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Team B
              </CardTitle>
              <CardDescription className="text-xs">Click to select</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableTeamB.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All players used</p>
              ) : (
                availableTeamB.map((player) => (
                  <button
                    key={player.tripPlayerId}
                    onClick={() => selectTeamBPlayer(player.tripPlayerId)}
                    className="w-full p-3 rounded-lg border border-border hover:border-blue-500 hover:bg-blue-500/10 transition text-left"
                  >
                    <div className="font-medium text-sm text-foreground">{player.name}</div>
                    <div className="text-xs text-muted-foreground">HCP: {player.handicap}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generated Matches */}
        {generatedMatches.length > 0 && (
          <Card className="mb-6 border-border/50">
            <CardHeader>
              <CardTitle>Generated Matches ({generatedMatches.length})</CardTitle>
              <CardDescription>
                {round.format === "1v1"
                  ? `${Math.ceil(generatedMatches.length / 2)} foursome(s) will be created (2 matches per foursome)`
                  : `${generatedMatches.length} foursome(s) will be created (1 match per foursome)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedMatches.map((match, index) => {
                  const teamANames = match.teamA
                    .map((tripPlayerId) => teamAPlayers.find((p) => p.tripPlayerId === tripPlayerId)?.name)
                    .join(" & ")
                  const teamBNames = match.teamB
                    .map((tripPlayerId) => teamBPlayers.find((p) => p.tripPlayerId === tripPlayerId)?.name)
                    .join(" & ")

                  const foursomeNum = round.format === "1v1" ? Math.floor(index / 2) + 1 : index + 1
                  const matchInFoursome = round.format === "1v1" ? (index % 2) + 1 : 1

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border bg-gradient-to-r from-card to-muted/20 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Foursome #{foursomeNum}
                              {round.format === "1v1" && ` - Match ${matchInFoursome}`}
                            </Badge>
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                              {round.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground text-sm">{teamANames}</span>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <span className="font-semibold text-foreground text-sm">{teamBNames}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMatch(index)}
                          className="w-8 h-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>

                      {((round.format === "1v1" && index % 2 === 1) || round.format === "2v2") && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">✓ Foursome #{foursomeNum} complete</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/trips/${tripId}?tab=rounds`} className="flex-1">
            <Button type="button" variant="outline" className="w-full bg-transparent">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90 gap-2" disabled={!!success}>
            <Zap className="w-4 h-4" />
            Save Matches ({generatedMatches.length})
          </Button>
        </div>
      </main>
    </div>
  )
}
