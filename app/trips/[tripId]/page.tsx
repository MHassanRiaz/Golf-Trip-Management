"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  Zap,
  DollarSign,
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Award,
  Hash,
  Edit,
  Eye,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { calculateTeamStandings } from "@/lib/standings-calculator"
import { generateHoleStrokeAllocation } from "@/lib/handicap-engine"
import { getVenue } from "@/lib/venue-storage" // Imported getVenue
import { getPlayer } from "@/lib/player-storage" // Imported getPlayer
import type { Player } from "@/lib/types" // Import Player type

export default function TripDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tripId = params.tripId as string
  const defaultTab = searchParams.get("tab") || "standings"
  const {
    getTrip,
    // deleteParticipant, // Removed deleteParticipant
    getRounds,
    deleteRound,
    getTeams,
    deleteTeam,
    getFoursomes,
    deleteFoursome,
    getMatches,
    getMatchScore,
    getExpenses,
    getTripPlayers,
    addTripPlayer,
    removeTripPlayer,
    updateTripPlayer,
  } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const teams = getTeams(tripId)
  const expenses = getExpenses(tripId)
  const tripPlayers = getTripPlayers(tripId) // Fetch trip players
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const venue = trip ? getVenue(trip.venueId) : null

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<string>("") // Changed to string to match updateParticipant call
  // const [editingParticipant, setEditingParticipant] = useState<string | null>(null) // Changed to editingPlayer
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  // const [editForm, setEditForm] = useState({ name: "", handicap: 0, ghin: "", details: "" }) // Changed editForm
  const [editForm, setEditForm] = useState({ team: "" })
  const [selectedRound, setSelectedRound] = useState<string | null>(null) // Declare selectedRound variable
  // add state for showing add player form and selected player/team
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")

  const router = useRouter() // Import useRouter

  const teamStandings = useMemo(() => {
    const allMatches: any[] = []
    const matchScores: Record<string, any> = {}
    const holeAllocations: Record<string, any[]> = {}

    for (const round of rounds) {
      const roundMatches = getMatches(round.id)
      allMatches.push(...roundMatches)

      for (const match of roundMatches) {
        const score = getMatchScore(match.id)
        if (score) {
          matchScores[match.id] = score

          // Generate hole allocations for this match
          const team1Players = match.team1Players
            .map((id) => {
              const tp = tripPlayers.find((p) => p.id === id)
              return tp ? getPlayer(tp.playerId) : null
            })
            .filter(Boolean) as Player[]
          const team2Players = match.team2Players
            .map((id) => {
              const tp = tripPlayers.find((p) => p.id === id)
              return tp ? getPlayer(tp.playerId) : null
            })
            .filter(Boolean) as Player[]

          if (team1Players.length > 0 && team2Players.length > 0) {
            holeAllocations[match.id] = generateHoleStrokeAllocation(team1Players, team2Players, match.format)
          }
        }
      }
    }

    const playersList = tripPlayers
      .map((tp) => {
        const player = getPlayer(tp.playerId)
        return player ? { ...player } : null
      })
      .filter((p): p is Player => p !== null)

    return calculateTeamStandings(allMatches, matchScores, holeAllocations, playersList)
  }, [rounds, tripPlayers, trip?.teams])

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip not found</p>
        </main>
      </div>
    )
  }

  // updated handleDelete to use player specific functions
  const handleDelete = (id: string, type: "player" | "round" | "team" | "foursome") => {
    if (type === "player") {
      removeTripPlayer(id)
    } else if (type === "round") {
      deleteRound(id)
    } else if (type === "team") {
      deleteTeam(id)
    } else if (type === "foursome") {
      deleteFoursome(id)
    }
    setDeleteConfirm(null)
    setDeleteType("") // Reset to empty string
  }

  // add handleAddPlayer function
  const handleAddPlayer = () => {
    if (selectedPlayerId && selectedTeamId) {
      addTripPlayer(tripId, selectedPlayerId, selectedTeamId)
      setSelectedPlayerId("")
      setSelectedTeamId("")
      setShowAddPlayer(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{trip.name}</h1>
              {/* <p className="text-muted-foreground mt-1">
                {trip.location} • {trip.startDate} - {trip.endDate}
              </p> */}
              {/* display venue information */}
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {venue ? `${venue.name} - ${venue.city}, ${venue.country}` : "Venue not found"} • {trip.startDate} -{" "}
                  {trip.endDate}
                </span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                onClick={() => router.push(`/trips/${tripId}/edit`)}
              >
                Edit Trip
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
                onClick={() => router.push("/trips")}
              >
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  {/* <p className="text-2xl font-bold text-foreground mt-1">{trip.participantsList.length}</p> */}
                  {/* Display number of trip players */}
                  <p className="text-2xl font-bold text-foreground mt-1">{tripPlayers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rounds</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{rounds.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{teams.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${totalExpenses.toFixed(0)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="w-full bg-gradient-to-br from-muted/80 to-muted/40 border-2 border-border/50 p-1 rounded-lg shadow-sm">
            <TabsTrigger
              value="standings"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all"
            >
              Standings
            </TabsTrigger>
            {/* renamed Participants to Players tab */}
            <TabsTrigger
              value="players"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all"
            >
              Players
            </TabsTrigger>
            <TabsTrigger
              value="rounds"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all"
            >
              Rounds
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="foursomes"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all"
            >
              Foursomes
            </TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Team Standings</CardTitle>
                <CardDescription>
                  {teamStandings.length > 0 && teamStandings[0].matchesPlayed > 0
                    ? "Live standings from match results"
                    : "No completed matches yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamStandings.length === 0 || teamStandings.every((t) => t.matchesPlayed === 0) ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No standings available yet. Complete some matches to see the leaderboard.
                    </p>
                    <Link href={`/trips/${tripId}?tab=rounds`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <ClipboardList className="w-4 h-4" />
                        Go to Rounds
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamStandings.map((team, idx) => (
                      <div
                        key={team.teamName}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                              idx === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.wins}W - {team.losses}L{team.ties > 0 && ` - ${team.ties}T`} • {team.matchesPlayed}{" "}
                              {team.matchesPlayed === 1 ? "match" : "matches"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Points</p>
                            <p className="font-bold text-foreground">{team.points}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Drink Points</p>
                            <p className="font-bold text-accent">{team.drinkPoints}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="players">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
                <div>
                  <CardTitle className="text-xl">Players</CardTitle>
                  <CardDescription>Players assigned to this trip</CardDescription>
                </div>
                {/* <Link href={`/trips/${tripId}/participants/new`}> */}
                {/* <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-sm">
                  <Plus className="w-4 h-4" />
                  Add Player
                </Button> */}
                {/* </Link> */}
                {/* toggle add player form */}
                <Button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Player
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {/* add add player form */}
                {showAddPlayer && (
                  <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">Select Player</label>
                        <select
                          value={selectedPlayerId}
                          onChange={(e) => setSelectedPlayerId(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Choose a player...</option>
                          <optgroup label="Available Players">
                            {/* Note: This would need getAllPlayers function to show available players not yet in trip */}
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Assign to Team</label>
                        <select
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Choose a team...</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddPlayer}
                          disabled={!selectedPlayerId || !selectedTeamId}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddPlayer(false)
                            setSelectedPlayerId("")
                            setSelectedTeamId("")
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* {trip.participantsList.length === 0 ? ( */}
                {tripPlayers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No participants yet</p>
                    {/* <Link href={`/trips/${tripId}/participants/new`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Add First Player
                      </Button>
                    </Link> */}
                    {/* use toggle for adding first player */}
                    <Button onClick={() => setShowAddPlayer(true)} className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4" />
                      Add First Player
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* {trip.participantsList.map((p) => ( */}
                    {tripPlayers.map((tripPlayer) => {
                      // const player = trip.participantsList.find((p) => p.id === tripPlayer.id); // this is wrong
                      const player = getPlayer(tripPlayer.playerId)
                      const playerTeam = teams.find((t) => t.id === tripPlayer.team)

                      return player ? ( // Check if player data exists
                        <div
                          key={tripPlayer.id}
                          className="group relative p-5 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                        >
                          {/* {editingParticipant === p.id ? ( */}
                          {editingPlayer === tripPlayer.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Team</label>
                                <select
                                  value={editForm.team}
                                  onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="">Choose a team...</option>
                                  {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                      {team.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (editForm.team) {
                                      updateTripPlayer(tripPlayer.id, { team: editForm.team })
                                      setEditingPlayer(null)
                                    }
                                  }}
                                  className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPlayer(null)
                                  }}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {/* {p.name} */}
                                    {player.name}
                                  </h4>
                                  {/* <p className="text-sm text-muted-foreground mt-1">
                                    {playerTeam ? `Team: ${playerTeam.name}` : "No team assigned"}
                                  </p> */}
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {playerTeam ? `Team: ${playerTeam.name}` : "No team assigned"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {/* <button
                                    onClick={() => {
                                      setEditingParticipant(p.id)
                                      setEditForm({
                                        name: p.name,
                                        handicap: p.handicap,
                                        ghin: p.ghin,
                                        details: p.details || "",
                                      })
                                    }}
                                    className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-all"
                                    title="Edit participant"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm(p.id)
                                      setDeleteType("participant")
                                    }}
                                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                                    title="Delete participant"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button> */}
                                  {/* update edit and delete icons to use player assignment */}
                                  <button
                                    onClick={() => {
                                      setEditingPlayer(tripPlayer.id)
                                      setEditForm({
                                        team: tripPlayer.team,
                                      })
                                    }}
                                    className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-all"
                                    title="Edit player assignment"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm(tripPlayer.id)
                                      setDeleteType("player") // Changed to "player"
                                    }}
                                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                                    title="Remove player"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                  <Award className="w-4 h-4 text-primary" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Handicap</p>
                                    <p className="text-sm font-bold text-primary">{player.handicapIndex}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                  <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">GHIN#</p>
                                    {/* <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{p.ghin}</p> */}
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                      {player.ghinNumber}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* {p.details && (
                                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 line-clamp-2">
                                  {p.details}
                                </p>
                              )} */}

                              {/* {deleteConfirm === p.id && deleteType === "participant" && ( */}
                              {deleteConfirm === tripPlayer.id && deleteType === "player" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-xl border-2 border-destructive/30 z-10">
                                  <div className="text-center p-4">
                                    {/* <p className="text-sm font-semibold text-foreground mb-4">Delete {p.name}?</p> */}
                                    <p className="text-sm font-semibold text-foreground mb-4">Remove {player.name}?</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setDeleteConfirm(null)
                                          setDeleteType("")
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        // onClick={() => {
                                        //   deleteParticipant(tripId, p.id)
                                        //   setDeleteConfirm(null)
                                        //   setDeleteType("")
                                        // }}
                                        onClick={() => {
                                          handleDelete(tripPlayer.id, "player") // Changed to handleDelete with player type
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : null // Render nothing if player data is not found
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rounds Tab */}
          <TabsContent value="rounds">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Rounds</CardTitle>
                  <CardDescription>All rounds in this trip</CardDescription>
                </div>
                <Link href={`/trips/${tripId}/rounds/new`}>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Add Round
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {rounds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No rounds yet</p>
                    <Link href={`/trips/${tripId}/rounds/new`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Create First Round
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rounds.map((round) => {
                      const matchCount = getMatches(round.id).length
                      const foursomeCount = getFoursomes(round.id).length
                      const matches = getMatches(round.id)

                      return (
                        <div
                          key={round.id}
                          className="flex flex-col gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {round.number}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{round.course}</h4>
                                <p className="text-sm text-muted-foreground">{round.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  round.status === "completed"
                                    ? "bg-accent/10 text-accent"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {round.status === "completed" ? "Completed" : "Planned"}
                              </span>
                              <button
                                onClick={() => {
                                  setDeleteConfirm(round.id)
                                  setDeleteType("round")
                                }}
                                className="p-2 hover:bg-destructive/10 rounded text-destructive transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === round.id && deleteType === "round" && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                  <div className="bg-background border border-border rounded-lg p-4 max-w-sm mx-4">
                                    <p className="text-sm font-medium mb-3">Delete Round {round.number}?</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setDeleteConfirm(null)
                                          setDeleteType("")
                                        }}
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="flex-1 bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleDelete(round.id, "round")}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>Foursomes: {foursomeCount}</span>
                                <span>Matches: {matchCount}</span>
                              </div>
                              {foursomeCount > 0 && (
                                <Link href={`/trips/${tripId}/rounds/${round.id}/matches/generate`}>
                                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                    <Zap className="w-3 h-3" />
                                    Generate Matches
                                  </Button>
                                </Link>
                              )}
                            </div>

                            {matches.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {matches.map((match) => {
                                  const matchScore = getMatchScore(match.id)
                                  const team1Names = match.team1Players
                                    .map((pid) => {
                                      const tp = tripPlayers.find((tp) => tp.id === pid)
                                      const player = tp ? getPlayer(tp.playerId) : null
                                      return player?.name
                                    })
                                    .join(" & ")
                                  const team2Names = match.team2Players
                                    .map((pid) => {
                                      const tp = tripPlayers.find((tp) => tp.id === pid)
                                      const player = tp ? getPlayer(tp.playerId) : null
                                      return player?.name
                                    })
                                    .join(" & ")

                                  const completedHoles = matchScore?.completedHoles || 0
                                  const isComplete = completedHoles === 18
                                  const statusColor = isComplete
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : completedHoles > 0
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                      : "bg-slate-500/10 text-slate-600 border-slate-500/20"

                                  return (
                                    <div
                                      key={match.id}
                                      className="group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                      <div className="relative p-5 space-y-4">
                                        {/* Match Header */}
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}
                                              </span>
                                              <div
                                                className={`h-1.5 w-1.5 rounded-full ${completedHoles > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                                              />
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground leading-tight">
                                              {team1Names}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">vs</p>
                                            <h4 className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                                              {team2Names}
                                            </h4>
                                          </div>

                                          <div
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusColor}`}
                                          >
                                            {isComplete
                                              ? "Complete"
                                              : completedHoles > 0
                                                ? `${completedHoles}/18`
                                                : "Not Started"}
                                          </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {completedHoles > 0 && (
                                          <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-muted-foreground">Progress</span>
                                              <span className="font-semibold text-foreground">
                                                {Math.round((completedHoles / 18) * 100)}%
                                              </span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                                style={{ width: `${(completedHoles / 18) * 100}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                          {completedHoles > 0 && (
                                            <Link
                                              href={`/trips/${tripId}/rounds/${round.id}/matches/${match.id}/details`}
                                              className="flex-1"
                                            >
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 bg-transparent hover:bg-card hover:border-primary/50"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                                View Details
                                              </Button>
                                            </Link>
                                          )}
                                          <Link
                                            href={`/trips/${tripId}/rounds/${round.id}/matches/${match.id}/score`}
                                            className={completedHoles > 0 ? "flex-1" : "w-full"}
                                          >
                                            <Button size="sm" className="w-full gap-2 bg-primary hover:bg-primary/90">
                                              <ClipboardList className="w-3.5 h-3.5" />
                                              {completedHoles > 0 ? "Continue" : "Enter Score"}
                                            </Button>
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Teams in this trip</CardDescription>
                </div>
                <Link href={`/trips/${tripId}/teams/new`}>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Add Team
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No teams yet</p>
                    <Link href={`/trips/${tripId}/teams/new`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Create First Team
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-lg ${team.color}`} />
                          <div>
                            <h4 className="font-semibold text-foreground">{team.name}</h4>
                            <p className="text-sm text-muted-foreground">{team.members.length} members</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setDeleteConfirm(team.id)
                            setDeleteType("team")
                          }}
                          className="p-2 hover:bg-destructive/10 rounded text-destructive transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === team.id && deleteType === "team" && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-4 z-50">
                            <p className="text-sm font-medium mb-3">Delete {team.name}?</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeleteConfirm(null)
                                  setDeleteType("")
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(team.id, "team")}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Foursomes Tab */}
          <TabsContent value="foursomes">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Foursomes Management</CardTitle>
                <CardDescription>Create 4-player groups for each round</CardDescription>
              </CardHeader>
              <CardContent>
                {rounds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Create a round first to add foursomes</p>
                    <Link href={`/trips/${tripId}/rounds/new`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Create Round
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Round Selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Select Round</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {rounds.map((round) => (
                          <button
                            key={round.id}
                            onClick={() => setSelectedRound(round.id)}
                            className={`p-3 rounded-lg border text-left transition ${
                              selectedRound === round.id
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground"
                            }`}
                          >
                            <div className="font-semibold text-sm">Round {round.number}</div>
                            <div className="text-xs mt-1">{round.course}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Foursomes for Selected Round */}
                    {selectedRound && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            Foursomes for Round {rounds.find((r) => r.id === selectedRound)?.number}
                          </h3>
                          <Link href={`/trips/${tripId}/rounds/${selectedRound}/foursomes/new`}>
                            <Button className="gap-2 bg-primary hover:bg-primary/90">
                              <Plus className="w-4 h-4" />
                              Add Foursome
                            </Button>
                          </Link>
                        </div>

                        {getFoursomes(selectedRound).length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-border rounded-lg">
                            <p className="text-muted-foreground mb-3">No foursomes created yet</p>
                            <Link href={`/trips/${tripId}/rounds/${selectedRound}/foursomes/new`}>
                              <Button variant="outline" className="gap-2 bg-transparent">
                                <Plus className="w-4 h-4" />
                                Create First Foursome
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFoursomes(selectedRound).map((foursome) => {
                              const playerNames = foursome.players
                                .map((playerId: string) => {
                                  const tripPlayer = tripPlayers.find((tp) => tp.playerId === playerId)
                                  return tripPlayer ? getPlayer(tripPlayer.playerId)?.name : undefined
                                })
                                .filter(Boolean)

                              return (
                                <div
                                  key={foursome.id}
                                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground mb-2">{foursome.name}</h4>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        {playerNames.map((name, idx) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                              {idx + 1}
                                            </div>
                                            <span className="text-sm text-foreground">{name}</span>
                                          </div>
                                        ))}
                                      </div>
                                      {foursome.teeTime && (
                                        <p className="text-xs text-muted-foreground">Tee Time: {foursome.teeTime}</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirm(foursome.id)
                                        setDeleteType("foursome")
                                      }}
                                      className="p-2 hover:bg-destructive/10 rounded text-destructive transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    {deleteConfirm === foursome.id && deleteType === "foursome" && (
                                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div className="bg-background border border-border rounded-lg p-4 max-w-sm mx-4">
                                          <p className="text-sm font-medium mb-3">Delete {foursome.name}?</p>
                                          <p className="text-xs text-muted-foreground mb-4">
                                            This will also delete all associated matches.
                                          </p>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setDeleteConfirm(null)
                                                setDeleteType("")
                                              }}
                                              className="flex-1"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="flex-1 bg-destructive hover:bg-destructive/90"
                                              onClick={() => handleDelete(foursome.id, "foursome")}
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
