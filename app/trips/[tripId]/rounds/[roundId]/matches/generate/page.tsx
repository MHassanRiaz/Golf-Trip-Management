"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Zap, AlertCircle, Users } from "lucide-react"
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
  const { getTrip, getRounds, getFoursomes, addMatch, getMatches, getTeams } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const foursomes = getFoursomes(roundId)
  const existingMatches = getMatches(roundId)
  const teams = getTeams(tripId)

  const [matchType, setMatchType] = useState<"1v1" | "2v2" | "teams" | "foursome">("1v1")
  const [selected1v1Players, setSelected1v1Players] = useState<string[]>([])
  const [selected2v2Players, setSelected2v2Players] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedFoursomes, setSelectedFoursomes] = useState<string[]>([])
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

  const handlePlayerToggle = (playerId: string, type: "1v1" | "2v2") => {
    if (type === "1v1") {
      if (selected1v1Players.includes(playerId)) {
        setSelected1v1Players(selected1v1Players.filter((id) => id !== playerId))
      } else {
        if (selected1v1Players.length < 2) {
          setSelected1v1Players([...selected1v1Players, playerId])
        }
      }
    } else {
      if (selected2v2Players.includes(playerId)) {
        setSelected2v2Players(selected2v2Players.filter((id) => id !== playerId))
      } else {
        if (selected2v2Players.length < 4) {
          setSelected2v2Players([...selected2v2Players, playerId])
        }
      }
    }
  }

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  const handleFoursomeToggle = (foursomeId: string) => {
    if (selectedFoursomes.includes(foursomeId)) {
      setSelectedFoursomes(selectedFoursomes.filter((id) => id !== foursomeId))
    } else {
      setSelectedFoursomes([...selectedFoursomes, foursomeId])
    }
  }

  const handleGenerate = () => {
    setError("")
    setSuccess("")

    try {
      let matches = []

      if (matchType === "1v1") {
        if (selected1v1Players.length !== 2) {
          setError("Please select exactly 2 players for 1v1 match")
          return
        }
        const match = {
          id: `match-${Date.now()}`,
          roundId: roundId,
          format: "1v1" as const,
          team1Players: [selected1v1Players[0]],
          team2Players: [selected1v1Players[1]],
          status: "planned" as const,
          team1Points: 0,
          team2Points: 0,
          team1DrinkPoints: 0,
          team2DrinkPoints: 0,
          scorerId: selected1v1Players[0],
        }
        matches = [match]
      } else if (matchType === "2v2") {
        if (selected2v2Players.length !== 4) {
          setError("Please select exactly 4 players for 2v2 match")
          return
        }
        const team1 = selected2v2Players.slice(0, 2)
        const team2 = selected2v2Players.slice(2, 4)
        const match = {
          id: `match-${Date.now()}`,
          roundId: roundId,
          format: "2v2" as const,
          team1Players: team1,
          team2Players: team2,
          status: "planned" as const,
          team1Points: 0,
          team2Points: 0,
          team1DrinkPoints: 0,
          team2DrinkPoints: 0,
          scorerId: team1[0],
        }
        matches = [match]
      } else if (matchType === "teams") {
        if (selectedTeams.length < 2) {
          setError("Please select at least 2 teams to create a match")
          return
        }

        const team1Id = selectedTeams[0]
        const team2Id = selectedTeams[1]
        const team1Data = teams.find((t) => t.id === team1Id)
        const team2Data = teams.find((t) => t.id === team2Id)

        if (!team1Data || !team2Data) {
          setError("Selected teams not found")
          return
        }

        const match = {
          id: `match-${Date.now()}`,
          roundId: roundId,
          format: "2v2" as const,
          team1Players: team1Data.members.slice(0, 2),
          team2Players: team2Data.members.slice(0, 2),
          status: "planned" as const,
          team1Points: 0,
          team2Points: 0,
          team1DrinkPoints: 0,
          team2DrinkPoints: 0,
          scorerId: team1Data.members[0],
          team1Id: team1Id,
          team2Id: team2Id,
        }
        matches = [match]
      } else if (matchType === "foursome") {
        if (selectedFoursomes.length === 0) {
          setError("Please select at least one foursome")
          return
        }
        const selectedFoursomeObjects = foursomes.filter((f) => selectedFoursomes.includes(f.id))
        matches = generateAllMatchesForRound(roundId, "2v2", selectedFoursomeObjects, trip.participantsList)
      }

      matches.forEach((match) => {
        addMatch(match)
      })

      setSuccess(`Successfully generated ${matches.length} match(es)!`)
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

            <div className="space-y-3">
              <Label>Choose Match Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setMatchType("1v1")}
                  className={`p-3 md:p-4 rounded-lg border text-left transition ${
                    matchType === "1v1"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1 text-sm md:text-base">1v1 Singles</div>
                  <div className="text-xs text-muted-foreground">Individual matchup</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMatchType("2v2")}
                  className={`p-3 md:p-4 rounded-lg border text-left transition ${
                    matchType === "2v2"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1 text-sm md:text-base">2v2 Best Ball</div>
                  <div className="text-xs text-muted-foreground">Team competition</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMatchType("teams")}
                  className={`p-3 md:p-4 rounded-lg border text-left transition ${
                    matchType === "teams"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1 text-sm md:text-base">Team Match</div>
                  <div className="text-xs text-muted-foreground">Match between teams</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMatchType("foursome")}
                  className={`p-3 md:p-4 rounded-lg border text-left transition ${
                    matchType === "foursome"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1 text-sm md:text-base">Foursomes</div>
                  <div className="text-xs text-muted-foreground">Pre-created groups</div>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
              <h3 className="font-semibold text-foreground mb-3">Round Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Foursomes</p>
                  <p className="font-semibold text-foreground">{foursomes.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teams</p>
                  <p className="font-semibold text-foreground">{teams.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Players</p>
                  <p className="font-semibold text-foreground">{trip.participantsList.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Existing Matches</p>
                  <p className="font-semibold text-foreground">{existingMatches.length}</p>
                </div>
              </div>
            </div>

            {matchType === "1v1" && (
              <div className="space-y-3">
                <Label>Select 2 Players ({selected1v1Players.length}/2)</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trip.participantsList.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => handlePlayerToggle(participant.id, "1v1")}
                      className={`w-full p-3 rounded-lg border text-left transition ${
                        selected1v1Players.includes(participant.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{participant.name}</div>
                          <div className="text-xs text-muted-foreground">Handicap: {participant.handicap}</div>
                        </div>
                        {selected1v1Players.includes(participant.id) && (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {selected1v1Players.indexOf(participant.id) + 1}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchType === "2v2" && (
              <div className="space-y-3">
                <Label>Select 4 Players ({selected2v2Players.length}/4)</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trip.participantsList.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => handlePlayerToggle(participant.id, "2v2")}
                      className={`w-full p-3 rounded-lg border text-left transition ${
                        selected2v2Players.includes(participant.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{participant.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Handicap: {participant.handicap} • Team: {participant.team}
                          </div>
                        </div>
                        {selected2v2Players.includes(participant.id) && (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {selected2v2Players.indexOf(participant.id) + 1}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchType === "teams" && (
              <div className="space-y-3">
                <Label>Select 2 Teams ({selectedTeams.length}/2)</Label>
                {teams.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center text-sm text-muted-foreground">
                    No teams created yet. Create teams first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => handleTeamToggle(team.id)}
                        className={`w-full p-3 rounded-lg border text-left transition ${
                          selectedTeams.includes(team.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.members.length} members</div>
                          </div>
                          <div className={`w-6 h-6 rounded-lg ${team.color}`}></div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {matchType === "foursome" && (
              <div className="space-y-3">
                <Label>Select Foursomes ({selectedFoursomes.length})</Label>
                {foursomes.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center text-sm text-muted-foreground">
                    No foursomes created yet. Create foursomes first or use other formats.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {foursomes.map((foursome) => {
                      const playerNames = foursome.players
                        .map((playerId) => trip?.participantsList.find((p) => p.id === playerId)?.name)
                        .join(", ")

                      return (
                        <button
                          key={foursome.id}
                          type="button"
                          onClick={() => handleFoursomeToggle(foursome.id)}
                          className={`w-full p-3 rounded-lg border text-left transition ${
                            selectedFoursomes.includes(foursome.id)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">{foursome.name}</div>
                              <div className="text-xs text-muted-foreground">{playerNames}</div>
                            </div>
                            {selectedFoursomes.includes(foursome.id) && <Users className="w-4 h-4 text-primary" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>1v1 Singles: Individual matchups between 2 players</li>
                <li>2v2 Best Ball: Team matches with 4 selected players</li>
                <li>Team Match: Create matches between different teams</li>
                <li>Foursomes: Generate matches from pre-created foursome groups</li>
                <li>Scorer is auto-assigned and match handicaps are calculated</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href={`/trips/${tripId}?tab=rounds`} className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleGenerate} className="flex-1 bg-primary hover:bg-primary/90 gap-2">
                <Zap className="w-4 h-4" />
                Generate Match{matchType === "foursome" && selectedFoursomes.length > 1 ? "es" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
