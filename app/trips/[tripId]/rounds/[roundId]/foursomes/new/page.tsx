"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function NewFoursomePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const roundId = params.roundId as string
  const { getTrip, getRounds, addFoursome, getTeams } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const round = rounds.find((r) => r.id === roundId)
  const teams = getTeams(tripId)

  const [foursomeType, setFoursomeType] = useState<"players" | "teams">("players")
  const [name, setName] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [teeTime, setTeeTime] = useState("")
  const [error, setError] = useState("")

  if (!trip || !round) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip or round not found</p>
        </main>
      </div>
    )
  }

  const handlePlayerToggle = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    } else {
      if (selectedPlayers.length < 4) {
        setSelectedPlayers([...selectedPlayers, playerId])
      } else {
        setError("A foursome can only have 4 players")
        setTimeout(() => setError(""), 3000)
      }
    }
  }

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId))
    } else {
      if (selectedTeams.length < 4) {
        setSelectedTeams([...selectedTeams, teamId])
      } else {
        setError("A team foursome can only have 4 teams")
        setTimeout(() => setError(""), 3000)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter a foursome name")
      return
    }

    if (foursomeType === "players") {
      if (selectedPlayers.length !== 4) {
        setError("You must select exactly 4 players")
        return
      }
      addFoursome(roundId, {
        name: name.trim(),
        players: selectedPlayers,
        teeTime: teeTime || undefined,
        type: "players",
      })
    } else {
      if (selectedTeams.length !== 4) {
        setError("You must select exactly 4 teams")
        return
      }

      const playersList: string[] = []
      selectedTeams.forEach((teamId) => {
        const team = teams.find((t) => t.id === teamId)
        if (team && team.members.length > 0) {
          playersList.push(team.members[0])
        }
      })

      if (playersList.length !== 4) {
        setError("Not all selected teams have members")
        return
      }

      addFoursome(roundId, {
        name: name.trim(),
        players: playersList,
        teeTime: teeTime || undefined,
        type: "teams",
        teamIds: selectedTeams,
      })
    }

    router.push(`/trips/${tripId}?tab=foursomes`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}?tab=foursomes`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Foursomes
        </Link>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Create Foursome</CardTitle>
                <CardDescription>
                  Round {round.number} - {round.course}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label>Foursome Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFoursomeType("players")
                      setSelectedTeams([])
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      foursomeType === "players"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">Select Players</div>
                    <div className="text-xs text-muted-foreground">Choose 4 individual players</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFoursomeType("teams")
                      setSelectedPlayers([])
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      foursomeType === "teams"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">Select Teams</div>
                    <div className="text-xs text-muted-foreground">Pick one player from 4 different teams</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Foursome Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning Group A"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teeTime">Tee Time (Optional)</Label>
                <Input
                  id="teeTime"
                  type="time"
                  value={teeTime}
                  onChange={(e) => setTeeTime(e.target.value)}
                  className="bg-background"
                />
              </div>

              {foursomeType === "players" ? (
                <div className="space-y-3">
                  <Label>Select Players ({selectedPlayers.length}/4)</Label>
                  <div className="grid gap-2">
                    {trip.participantsList.map((participant) => {
                      const isSelected = selectedPlayers.includes(participant.id)
                      return (
                        <button
                          key={participant.id}
                          type="button"
                          onClick={() => handlePlayerToggle(participant.id)}
                          className={`p-3 rounded-lg border text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">{participant.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Handicap: {participant.handicap} • Team: {participant.team}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                {selectedPlayers.indexOf(participant.id) + 1}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Select Teams ({selectedTeams.length}/4)</Label>
                  {teams.length < 4 ? (
                    <p className="text-sm text-muted-foreground">
                      You need at least 4 teams to create a team foursome.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {teams.map((team) => {
                        const isSelected = selectedTeams.includes(team.id)
                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => handleTeamToggle(team.id)}
                            className={`p-3 rounded-lg border text-left transition ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground">{team.name}</div>
                                <div className="text-sm text-muted-foreground mt-1">{team.members.length} members</div>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                  {selectedTeams.indexOf(team.id) + 1}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Link href={`/trips/${tripId}?tab=foursomes`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Create Foursome
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
