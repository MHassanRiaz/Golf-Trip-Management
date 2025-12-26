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
  Flag,
  UsersIcon,
  Grid,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { calculateTeamStandings } from "@/lib/standings-calculator"
import { generateHoleStrokeAllocation } from "@/lib/handicap-engine"

export default function TripDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tripId = params.tripId as string
  const defaultTab = searchParams.get("tab") || "standings"
  const {
    getTrip,
    deleteParticipant,
    getRounds,
    deleteRound,
    getTeams,
    deleteTeam,
    getFoursomes,
    deleteFoursome,
    getMatches,
    getMatchScore,
    getExpenses,
    updateParticipant, // Import updateParticipant
  } = useAuth()
  const trip = getTrip(tripId)
  const rounds = getRounds(tripId)
  const teams = getTeams(tripId)
  const expenses = getExpenses(tripId)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<string>("") // Changed to string to match updateParticipant call
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", handicap: 0, ghin: "", details: "" })
  const [selectedRound, setSelectedRound] = useState<string | null>(null) // Declare selectedRound variable

  const router = useRouter() // Import useRouter

  // State for active tab and handler
  const [activeTab, setActiveTab] = useState(defaultTab)
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/trips/${tripId}?tab=${value}`, { scroll: false }) // Update URL without full page reload
  }

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
            .map((id) => trip?.participantsList.find((p) => p.id === id))
            .filter(Boolean) as any[]
          const team2Players = match.team2Players
            .map((id) => trip?.participantsList.find((p) => p.id === id))
            .filter(Boolean) as any[]

          if (team1Players.length > 0 && team2Players.length > 0) {
            holeAllocations[match.id] = generateHoleStrokeAllocation(team1Players, team2Players, match.format)
          }
        }
      }
    }

    return calculateTeamStandings(allMatches, matchScores, holeAllocations, trip?.participantsList || [])
  }, [rounds, getMatches, getMatchScore, trip])

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

  const handleDelete = (id: string, type: "participant" | "round" | "team" | "foursome") => {
    if (type === "participant") {
      deleteParticipant(tripId, id)
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
              <p className="text-muted-foreground mt-1">
                {trip.location} • {trip.startDate} - {trip.endDate}
              </p>
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
                  <p className="text-2xl font-bold text-foreground mt-1">{trip.participantsList.length}</p>
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
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full bg-gradient-to-br from-muted/80 to-muted/40 border-2 border-border/50 p-1 rounded-lg shadow-sm overflow-x-auto flex justify-start md:justify-between">
            <TabsTrigger
              value="standings"
              className="hidden sm:flex flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Standings</span>
            </TabsTrigger>
            <TabsTrigger
              value="standings"
              className="sm:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md p-2 rounded-md transition-all"
              title="Standings"
            >
              <Trophy className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger
              value="participants"
              className="hidden sm:flex flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Participants</span>
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="sm:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md p-2 rounded-md transition-all"
              title="Participants"
            >
              <Users className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger
              value="rounds"
              className="hidden sm:flex flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <Flag className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Rounds</span>
            </TabsTrigger>
            <TabsTrigger
              value="rounds"
              className="sm:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md p-2 rounded-md transition-all"
              title="Rounds"
            >
              <Flag className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger
              value="teams"
              className="hidden sm:flex flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="sm:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md p-2 rounded-md transition-all"
              title="Teams"
            >
              <UsersIcon className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger
              value="foursomes"
              className="hidden sm:flex flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <Grid className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Foursomes</span>
            </TabsTrigger>
            <TabsTrigger
              value="foursomes"
              className="sm:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md p-2 rounded-md transition-all"
              title="Foursomes"
            >
              <Grid className="w-4 h-4" />
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
          <TabsContent value="participants">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
                <div>
                  <CardTitle className="text-xl">Participants</CardTitle>
                  <CardDescription>Players in this trip</CardDescription>
                </div>
                <Link href={`/trips/${tripId}/participants/new`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Player
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-6">
                {trip.participantsList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No participants yet</p>
                    <Link href={`/trips/${tripId}/participants/new`}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Add First Player
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trip.participantsList.map((p) => (
                      <div
                        key={p.id}
                        className="group relative p-5 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                      >
                        {editingParticipant === p.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">GHIN#</label>
                              <input
                                type="text"
                                value={editForm.ghin}
                                onChange={(e) => setEditForm({ ...editForm, ghin: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Handicap</label>
                              <input
                                type="number"
                                value={editForm.handicap}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, handicap: Number.parseFloat(e.target.value) })
                                }
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Details (optional)</label>
                              <textarea
                                value={editForm.details}
                                onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (editForm.name && editForm.ghin) {
                                    updateParticipant(tripId, p.id, editForm)
                                    setEditingParticipant(null)
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
                                  setEditingParticipant(null)
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
                                  {p.name}
                                </h4>
                              </div>
                              <div className="flex gap-2">
                                <button
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
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                <Award className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Handicap</p>
                                  <p className="text-sm font-bold text-primary">{p.handicap}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <p className="text-xs text-muted-foreground">GHIN#</p>
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{p.ghin}</p>
                                </div>
                              </div>
                            </div>

                            {p.details && (
                              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 line-clamp-2">
                                {p.details}
                              </p>
                            )}

                            {deleteConfirm === p.id && deleteType === "participant" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-xl border-2 border-destructive/30 z-10">
                                <div className="text-center p-4">
                                  <p className="text-sm font-semibold text-foreground mb-4">Delete {p.name}?</p>
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
                                      onClick={() => {
                                        deleteParticipant(tripId, p.id)
                                        setDeleteConfirm(null)
                                        setDeleteType("")
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rounds Tab */}
          <TabsContent value="rounds">
            <Card className="border-border/50">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle>Rounds</CardTitle>
                  <CardDescription>All rounds in this trip</CardDescription>
                </div>
                <Link href={`/trips/${tripId}/rounds/new`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Add Round
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {rounds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No rounds yet</p>
                    <Link href={`/trips/${tripId}/rounds/new`} className="w-full sm:w-auto inline-block">
                      <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Create First Round
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rounds.map((round) => {
                      const matchCount = getMatches(round.id).length
                      const foursomeCount = getFoursomes(round.id).length
                      const matches = getMatches(round.id)

                      return (
                        <div
                          key={round.id}
                          className="flex flex-col gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition"
                        >
                          {/* Header with Round Number and Title */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                              {round.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate">{round.course}</h4>
                              <p className="text-sm text-muted-foreground">{round.date}</p>
                            </div>
                          </div>

                          {/* Status Badge and Actions - Stacked on Mobile */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 border-t border-border/50 pt-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                                round.status === "completed" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                              }`}
                            >
                              {round.status === "completed" ? "Completed" : "Planned"}
                            </span>
                            <div className="flex gap-2 ml-auto">
                              <button
                                onClick={() => {
                                  setDeleteConfirm(round.id)
                                  setDeleteType("round")
                                }}
                                className="p-2 hover:bg-destructive/10 rounded text-destructive transition"
                                title="Delete round"
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

                          {/* Stats and Generate Button */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/50">
                            <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <span>Foursomes: {foursomeCount}</span>
                              <span>Matches: {matchCount}</span>
                            </div>
                            <Link
                              href={`/trips/${tripId}/rounds/${round.id}/matches/generate`}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto gap-2 bg-transparent text-xs sm:text-sm"
                              >
                                <Zap className="w-3 h-3" />
                                <span className="hidden sm:inline">Generate Matches</span>
                                <span className="sm:hidden">Generate</span>
                              </Button>
                            </Link>
                          </div>

                          {/* Match Cards Grid */}
                          {matches.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                              {matches.map((match) => {
                                const matchScore = getMatchScore(match.id)
                                const team1Names = match.team1Players
                                  .map((pid) => trip?.participantsList.find((p) => p.id === pid)?.name)
                                  .join(" & ")
                                const team2Names = match.team2Players
                                  .map((pid) => trip?.participantsList.find((p) => p.id === pid)?.name)
                                  .join(" & ")

                                const completedHoles = matchScore?.completedHoles || 0
                                const isComplete = completedHoles === 5
                                const statusColor = isComplete
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : completedHoles > 0
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-slate-500/10 text-slate-600 border-slate-500/20"

                                return (
                                  <div
                                    key={match.id}
                                    className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-card hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="relative p-3 sm:p-4 space-y-3">
                                      {/* Match Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                              {match.format === "2v2" ? "2v2 Best Ball" : "1v1 Singles"}
                                            </span>
                                            <div
                                              className={`h-1.5 w-1.5 rounded-full ${completedHoles > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                                            />
                                          </div>
                                          <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-tight truncate">
                                            {team1Names}
                                          </h4>
                                          <p className="text-xs text-muted-foreground mt-0.5">vs</p>
                                          <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-tight mt-0.5 truncate">
                                            {team2Names}
                                          </h4>
                                        </div>

                                        <div
                                          className={`px-2 py-1 rounded border text-xs font-semibold flex-shrink-0 ${statusColor}`}
                                        >
                                          {isComplete
                                            ? "Complete"
                                            : completedHoles > 0
                                              ? `${completedHoles}/5`
                                              : "Not Started"}
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      {completedHoles > 0 && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold text-foreground">
                                              {Math.round((completedHoles / 5) * 100)}%
                                            </span>
                                          </div>
                                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                              style={{ width: `${(completedHoles / 5) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                        {completedHoles > 0 && (
                                          <Link
                                            href={`/trips/${tripId}/rounds/${round.id}/matches/${match.id}/details`}
                                            className="w-full sm:flex-1"
                                          >
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full gap-1 sm:gap-2 bg-transparent hover:bg-card hover:border-primary/50 text-xs sm:text-sm"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span className="hidden sm:inline">View Details</span>
                                              <span className="sm:hidden">Details</span>
                                            </Button>
                                          </Link>
                                        )}
                                        <Link
                                          href={`/trips/${tripId}/rounds/${round.id}/matches/${match.id}/score`}
                                          className={completedHoles > 0 ? "w-full sm:flex-1" : "w-full"}
                                        >
                                          <Button
                                            size="sm"
                                            className="w-full gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-xs sm:text-sm"
                                          >
                                            <ClipboardList className="w-3 h-3" />
                                            {completedHoles > 0 ? "Continue" : "Enter"}
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
                                .map((playerId) => trip.participantsList.find((p) => p.id === playerId)?.name)
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
