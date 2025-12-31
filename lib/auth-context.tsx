"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Player {
  id: string
  name: string
  ghinNumber: string
  email: string
  handicap: number
}

interface TripPlayer {
  id: string
  playerId: string // Reference to global Player
  tripId: string
  team?: string // Team assignment for this trip
  details?: string
}

interface User {
  id: string
  email: string
  name: string
}

interface Round {
  id: string
  number: number
  tripId: string
  course: string
  date: string
  format?: "2v2" | "1v1"
  drinkingMode?: boolean
  teeBox?: string
  teamIds?: string[]
  status: "planned" | "completed"
  createdAt: string
}

interface Team {
  id: string
  name: string
  tripId: string
  color: string
  members: string[] // Now TripPlayer IDs instead of Participant IDs
  createdAt: string
}

interface Trip {
  id: string
  name: string
  venueId: string
  startDate: string
  endDate: string
  description: string
  createdAt: string
  status: "upcoming" | "active" | "completed"
}

interface TripWithPlayers extends Trip {
  playersList: TripPlayer[]
}

interface Foursome {
  id: string
  roundId: string
  name: string
  players: string[] // TripPlayer IDs (must be exactly 4)
  teeTime?: string
  createdAt: string
}

interface Match {
  id: string
  roundId: string
  foursomeId: string
  format: "2v2" | "1v1"
  team1Players: string[] // TripPlayer IDs
  team2Players: string[] // TripPlayer IDs
  scorer?: string // TripPlayer ID assigned as scorer
  matchHandicap?: number
  status: "planned" | "in-progress" | "completed"
  createdAt: string
}

interface HoleScore {
  hole: number
  player1Gross?: number
  player2Gross?: number
  player3Gross?: number
  player4Gross?: number
  drinks?: number
}

interface MatchScore {
  id: string
  matchId: string
  holes: HoleScore[]
  completedHoles: number
  createdAt: string
  updatedAt: string
}

interface Expense {
  id: string
  tripId: string
  amount: number
  category: string
  description: string
  paidBy: string // TripPlayer ID
  splitType: "equal" | "custom"
  splitWith: string[] // TripPlayer IDs
  customSplits?: Record<string, number>
  date: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  trips: Trip[]
  addTrip: (trip: Omit<Trip, "id" | "createdAt" | "status">) => void
  updateTrip: (tripId: string, updates: Partial<Omit<Trip, "id" | "createdAt">>) => void
  addTripPlayer: (tripId: string, playerId: string, teamId?: string) => void
  getTripPlayers: (tripId: string) => TripPlayer[]
  getTrip: (tripId: string) => TripWithPlayers | null
  removeTripPlayer: (tripPlayerId: string) => void
  updateTripPlayer: (tripPlayerId: string, updates: Partial<Omit<TripPlayer, "id">>) => void
  addRound: (tripId: string, round: Omit<Round, "id" | "tripId" | "createdAt">) => void
  getRounds: (tripId: string) => Round[]
  deleteRound: (roundId: string) => void
  addTeam: (tripId: string, team: Omit<Team, "id" | "tripId" | "createdAt">) => void
  getTeams: (tripId: string) => Team[]
  deleteTeam: (teamId: string) => void
  addTeamMember: (teamId: string, memberId: string) => void
  removeTeamMember: (teamId: string, memberId: string) => void
  addFoursome: (roundId: string, foursome: Omit<Foursome, "id" | "roundId" | "createdAt">) => void
  getFoursomes: (roundId: string) => Foursome[]
  deleteFoursome: (foursomeId: string) => void
  updateFoursome: (foursomeId: string, updates: Partial<Omit<Foursome, "id" | "roundId" | "createdAt">>) => void
  addMatch: (match: Omit<Match, "id" | "createdAt">) => void
  getMatches: (roundId: string) => Match[]
  getMatchesByFoursome: (foursomeId: string) => Match[]
  deleteMatch: (matchId: string) => void
  addMatchScore: (matchScore: Omit<MatchScore, "id" | "createdAt" | "updatedAt">) => void
  getMatchScore: (matchId: string) => MatchScore | null
  updateHoleScore: (matchId: string, hole: number, scoreData: Partial<HoleScore>) => void
  addExpense: (tripId: string, expense: Omit<Expense, "id" | "tripId" | "createdAt">) => void
  getExpenses: (tripId: string) => Expense[]
  deleteExpense: (expenseId: string) => void
  updateExpense: (expenseId: string, updates: Partial<Omit<Expense, "id" | "tripId" | "createdAt">>) => void
  tripPlayers: Record<string, TripPlayer[]>
  foursomes: Foursome[]
  rounds: Round[]
  teams: Team[]
  tripRounds: Record<string, Round[]>
  matchScores: Record<string, MatchScore>
  roundMatches: Record<string, Match[]>
  updateMatchStatus: (matchId: string, status: "planned" | "in-progress" | "completed") => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripPlayers, setTripPlayers] = useState<Record<string, TripPlayer[]>>({})
  const [tripRounds, setTripRounds] = useState<Record<string, Round[]>>({})
  const [tripTeams, setTripTeams] = useState<Record<string, Team[]>>({})
  const [roundFoursomes, setRoundFoursomes] = useState<Record<string, Foursome[]>>({})
  const [roundMatches, setRoundMatches] = useState<Record<string, Match[]>>({})
  const [matchScores, setMatchScores] = useState<Record<string, MatchScore>>({})
  const [tripExpenses, setTripExpenses] = useState<Record<string, Expense[]>>({})

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("[v0] Failed to parse stored user:", error)
        localStorage.removeItem("user")
      }
    }

    const storedTrips = localStorage.getItem("trips")
    if (storedTrips) {
      try {
        setTrips(JSON.parse(storedTrips))
      } catch (error) {
        console.error("[v0] Failed to parse stored trips:", error)
        localStorage.removeItem("trips")
      }
    }

    const storedTripPlayers = localStorage.getItem("tripPlayers")
    if (storedTripPlayers) {
      try {
        setTripPlayers(JSON.parse(storedTripPlayers))
      } catch (error) {
        console.error("[v0] Failed to parse stored trip players:", error)
        localStorage.removeItem("tripPlayers")
      }
    }

    const storedRounds = localStorage.getItem("tripRounds")
    if (storedRounds) {
      try {
        setTripRounds(JSON.parse(storedRounds))
      } catch (error) {
        console.error("[v0] Failed to parse stored rounds:", error)
        localStorage.removeItem("tripRounds")
      }
    }

    const storedTeams = localStorage.getItem("tripTeams")
    if (storedTeams) {
      try {
        setTripTeams(JSON.parse(storedTeams))
      } catch (error) {
        console.error("[v0] Failed to parse stored teams:", error)
        localStorage.removeItem("tripTeams")
      }
    }

    const storedFoursomes = localStorage.getItem("roundFoursomes")
    if (storedFoursomes) {
      try {
        setRoundFoursomes(JSON.parse(storedFoursomes))
      } catch (error) {
        console.error("[v0] Failed to parse stored foursomes:", error)
        localStorage.removeItem("roundFoursomes")
      }
    }

    const storedMatches = localStorage.getItem("roundMatches")
    if (storedMatches) {
      try {
        setRoundMatches(JSON.parse(storedMatches))
      } catch (error) {
        console.error("[v0] Failed to parse stored matches:", error)
        localStorage.removeItem("roundMatches")
      }
    }

    const storedMatchScores = localStorage.getItem("matchScores")
    if (storedMatchScores) {
      try {
        setMatchScores(JSON.parse(storedMatchScores))
      } catch (error) {
        console.error("[v0] Failed to parse stored match scores:", error)
        localStorage.removeItem("matchScores")
      }
    }

    const storedExpenses = localStorage.getItem("tripExpenses")
    if (storedExpenses) {
      try {
        setTripExpenses(JSON.parse(storedExpenses))
      } catch (error) {
        console.error("[v0] Failed to parse stored expenses:", error)
        localStorage.removeItem("tripExpenses")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (email === "demo@golftrip.com" && password === "password") {
        const userData: User = {
          id: "1",
          email: email,
          name: "Demo User",
        }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("auth_token", "demo_token_" + Date.now())
      } else {
        throw new Error("Invalid credentials")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const userData: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: name,
      }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("auth_token", "demo_token_" + Date.now())
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("auth_token")
  }

  const addTrip = (tripData: Omit<Trip, "id" | "createdAt" | "status">) => {
    const newTrip: Trip = {
      ...tripData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: "upcoming",
    }

    const updatedTrips = [...trips, newTrip]
    setTrips(updatedTrips)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))

    const team1: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Team A",
      tripId: newTrip.id,
      color: "#3b82f6",
      members: [],
      createdAt: new Date().toISOString(),
    }

    const team2: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Team B",
      tripId: newTrip.id,
      color: "#ef4444",
      members: [],
      createdAt: new Date().toISOString(),
    }

    const updatedTeams = {
      ...tripTeams,
      [newTrip.id]: [team1, team2],
    }

    setTripTeams(updatedTeams)
    localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
  }

  const updateTrip = (tripId: string, updates: Partial<Omit<Trip, "id" | "createdAt">>) => {
    const updatedTrips = trips.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip))
    setTrips(updatedTrips)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))
  }

  const addTripPlayer = (tripId: string, playerId: string, teamId?: string) => {
    let assignedTeamId = teamId

    if (!assignedTeamId) {
      const teams = getTeams(tripId)
      const existingPlayers = getTripPlayers(tripId)

      if (teams.length >= 2) {
        const team1Count = existingPlayers.filter((tp) => tp.team === teams[0].id).length
        const team2Count = existingPlayers.filter((tp) => tp.team === teams[1].id).length

        assignedTeamId = team1Count <= team2Count ? teams[0].id : teams[1].id
      } else if (teams.length === 1) {
        assignedTeamId = teams[0].id
      }
    }

    const newTripPlayer: TripPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      playerId,
      tripId,
      team: assignedTeamId,
    }

    const updatedTripPlayers = {
      ...tripPlayers,
      [tripId]: [...(tripPlayers[tripId] || []), newTripPlayer],
    }

    setTripPlayers(updatedTripPlayers)
    localStorage.setItem("tripPlayers", JSON.stringify(updatedTripPlayers))

    if (assignedTeamId) {
      const updatedTeams = { ...tripTeams }
      if (updatedTeams[tripId]) {
        updatedTeams[tripId] = updatedTeams[tripId].map((team) =>
          team.id === assignedTeamId ? { ...team, members: [...team.members, newTripPlayer.id] } : team,
        )
        setTripTeams(updatedTeams)
        localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
      }
    }
  }

  const getTripPlayers = (tripId: string) => {
    return tripPlayers[tripId] || []
  }

  const getTrip = (tripId: string): TripWithPlayers | null => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return null

    return {
      ...trip,
      playersList: getTripPlayers(tripId),
    }
  }

  const removeTripPlayer = (tripPlayerId: string) => {
    const tripPlayer = Object.values(tripPlayers)
      .flat()
      .find((tp) => tp.id === tripPlayerId)

    if (!tripPlayer) return

    const updatedTripPlayers = {
      ...tripPlayers,
      [tripPlayer.tripId]: tripPlayers[tripPlayer.tripId].filter((tp) => tp.id !== tripPlayerId),
    }
    setTripPlayers(updatedTripPlayers)
    localStorage.setItem("tripPlayers", JSON.stringify(updatedTripPlayers))

    if (tripPlayer.team) {
      const updatedTeams = { ...tripTeams }
      if (updatedTeams[tripPlayer.tripId]) {
        updatedTeams[tripPlayer.tripId] = updatedTeams[tripPlayer.tripId].map((team) =>
          team.id === tripPlayer.team ? { ...team, members: team.members.filter((m) => m !== tripPlayerId) } : team,
        )
        setTripTeams(updatedTeams)
        localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
      }
    }
  }

  const updateTripPlayer = (tripPlayerId: string, updates: Partial<Omit<TripPlayer, "id">>) => {
    const updatedTripPlayers = { ...tripPlayers }
    for (const tripId in updatedTripPlayers) {
      updatedTripPlayers[tripId] = updatedTripPlayers[tripId].map((tp) =>
        tp.id === tripPlayerId ? { ...tp, ...updates } : tp,
      )
    }
    setTripPlayers(updatedTripPlayers)
    localStorage.setItem("tripPlayers", JSON.stringify(updatedTripPlayers))
  }

  const addRound = (tripId: string, roundData: Omit<Round, "id" | "tripId" | "createdAt">) => {
    const newRound: Round = {
      ...roundData,
      id: Math.random().toString(36).substr(2, 9),
      tripId,
      createdAt: new Date().toISOString(),
    }

    const updatedRounds = {
      ...tripRounds,
      [tripId]: [...(tripRounds[tripId] || []), newRound],
    }

    setTripRounds(updatedRounds)
    localStorage.setItem("tripRounds", JSON.stringify(updatedRounds))
  }

  const getRounds = (tripId: string) => {
    return tripRounds[tripId] || []
  }

  const deleteRound = (roundId: string) => {
    const updatedRounds = { ...tripRounds }
    for (const tripId in updatedRounds) {
      updatedRounds[tripId] = updatedRounds[tripId].filter((r) => r.id !== roundId)
    }
    setTripRounds(updatedRounds)
    localStorage.setItem("tripRounds", JSON.stringify(updatedRounds))
  }

  const addTeam = (tripId: string, teamData: Omit<Team, "id" | "tripId" | "createdAt">) => {
    const newTeam: Team = {
      ...teamData,
      id: Math.random().toString(36).substr(2, 9),
      tripId,
      createdAt: new Date().toISOString(),
    }

    const updatedTeams = {
      ...tripTeams,
      [tripId]: [...(tripTeams[tripId] || []), newTeam],
    }

    setTripTeams(updatedTeams)
    localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
  }

  const getTeams = (tripId: string) => {
    return tripTeams[tripId] || []
  }

  const deleteTeam = (teamId: string) => {
    const updatedTeams = { ...tripTeams }
    for (const tripId in updatedTeams) {
      updatedTeams[tripId] = updatedTeams[tripId].filter((t) => t.id !== teamId)
    }
    setTripTeams(updatedTeams)
    localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
  }

  const addTeamMember = (teamId: string, memberId: string) => {
    const updatedTeams = { ...tripTeams }
    for (const tripId in updatedTeams) {
      updatedTeams[tripId] = updatedTeams[tripId].map((team) =>
        team.id === teamId && !team.members.includes(memberId)
          ? { ...team, members: [...team.members, memberId] }
          : team,
      )
    }
    setTripTeams(updatedTeams)
    localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
  }

  const removeTeamMember = (teamId: string, memberId: string) => {
    const updatedTeams = { ...tripTeams }
    for (const tripId in updatedTeams) {
      updatedTeams[tripId] = updatedTeams[tripId].map((team) =>
        team.id === teamId ? { ...team, members: team.members.filter((m) => m !== memberId) } : team,
      )
    }
    setTripTeams(updatedTeams)
    localStorage.setItem("tripTeams", JSON.stringify(updatedTeams))
  }

  const addFoursome = (roundId: string, foursomeData: Omit<Foursome, "id" | "roundId" | "createdAt">) => {
    const newFoursome: Foursome = {
      ...foursomeData,
      id: Math.random().toString(36).substr(2, 9),
      roundId,
      createdAt: new Date().toISOString(),
    }

    const updatedFoursomes = {
      ...roundFoursomes,
      [roundId]: [...(roundFoursomes[roundId] || []), newFoursome],
    }

    setRoundFoursomes(updatedFoursomes)
    localStorage.setItem("roundFoursomes", JSON.stringify(updatedFoursomes))
  }

  const getFoursomes = (roundId: string) => {
    return roundFoursomes[roundId] || []
  }

  const deleteFoursome = (foursomeId: string) => {
    const updatedFoursomes = { ...roundFoursomes }
    for (const roundId in updatedFoursomes) {
      updatedFoursomes[roundId] = updatedFoursomes[roundId].filter((f) => f.id !== foursomeId)
    }
    setRoundFoursomes(updatedFoursomes)
    localStorage.setItem("roundFoursomes", JSON.stringify(updatedFoursomes))

    const updatedMatches = { ...roundMatches }
    for (const roundId in updatedMatches) {
      updatedMatches[roundId] = updatedMatches[roundId].filter((m) => m.foursomeId !== foursomeId)
    }
    setRoundMatches(updatedMatches)
    localStorage.setItem("roundMatches", JSON.stringify(updatedMatches))
  }

  const updateFoursome = (foursomeId: string, updates: Partial<Omit<Foursome, "id" | "roundId" | "createdAt">>) => {
    const updatedFoursomes = { ...roundFoursomes }
    for (const roundId in updatedFoursomes) {
      updatedFoursomes[roundId] = updatedFoursomes[roundId].map((foursome) =>
        foursome.id === foursomeId ? { ...foursome, ...updates } : foursome,
      )
    }
    setRoundFoursomes(updatedFoursomes)
    localStorage.setItem("roundFoursomes", JSON.stringify(updatedFoursomes))
  }

  const addMatch = (matchData: Omit<Match, "id" | "createdAt">) => {
    const newMatch: Match = {
      ...matchData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }

    const updatedMatches = {
      ...roundMatches,
      [matchData.roundId]: [...(roundMatches[matchData.roundId] || []), newMatch],
    }

    setRoundMatches(updatedMatches)
    localStorage.setItem("roundMatches", JSON.stringify(updatedMatches))
  }

  const getMatches = (roundId: string) => {
    return roundMatches[roundId] || []
  }

  const getMatchesByFoursome = (foursomeId: string) => {
    const allMatches: Match[] = []
    for (const roundId in roundMatches) {
      allMatches.push(...roundMatches[roundId].filter((m) => m.foursomeId === foursomeId))
    }
    return allMatches
  }

  const deleteMatch = (matchId: string) => {
    const updatedMatches = { ...roundMatches }
    for (const roundId in updatedMatches) {
      updatedMatches[roundId] = updatedMatches[roundId].filter((m) => m.id !== matchId)
    }
    setRoundMatches(updatedMatches)
    localStorage.setItem("roundMatches", JSON.stringify(updatedMatches))
  }

  const addMatchScore = (matchScoreData: Omit<MatchScore, "id" | "createdAt" | "updatedAt">) => {
    const newMatchScore: MatchScore = {
      ...matchScoreData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedMatchScores = {
      ...matchScores,
      [matchScoreData.matchId]: newMatchScore,
    }

    setMatchScores(updatedMatchScores)
    localStorage.setItem("matchScores", JSON.stringify(updatedMatchScores))
  }

  const getMatchScore = (matchId: string): MatchScore | null => {
    return matchScores[matchId] || null
  }

  const updateMatchStatus = (matchId: string, status: "planned" | "in-progress" | "completed") => {
    const updatedMatches = { ...roundMatches }
    for (const roundId in updatedMatches) {
      updatedMatches[roundId] = updatedMatches[roundId].map((match) =>
        match.id === matchId ? { ...match, status } : match,
      )
    }
    setRoundMatches(updatedMatches)
    localStorage.setItem("roundMatches", JSON.stringify(updatedMatches))
  }

  const updateHoleScore = (matchId: string, hole: number, scoreData: Partial<HoleScore>) => {
    const matchScore = matchScores[matchId]
    if (!matchScore) return

    const updatedHoles = matchScore.holes.map((h) => (h.hole === hole ? { ...h, ...scoreData } : h))

    const updatedMatchScores = {
      ...matchScores,
      [matchId]: {
        ...matchScore,
        holes: updatedHoles,
        updatedAt: new Date().toISOString(),
      },
    }

    setMatchScores(updatedMatchScores)
    localStorage.setItem("matchScores", JSON.stringify(updatedMatchScores))
  }

  const addExpense = (tripId: string, expenseData: Omit<Expense, "id" | "tripId" | "createdAt">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Math.random().toString(36).substr(2, 9),
      tripId,
      createdAt: new Date().toISOString(),
    }

    const updatedExpenses = {
      ...tripExpenses,
      [tripId]: [...(tripExpenses[tripId] || []), newExpense],
    }

    setTripExpenses(updatedExpenses)
    localStorage.setItem("tripExpenses", JSON.stringify(updatedExpenses))
  }

  const getExpenses = (tripId: string) => {
    return tripExpenses[tripId] || []
  }

  const deleteExpense = (expenseId: string) => {
    const updatedExpenses = { ...tripExpenses }
    for (const tripId in updatedExpenses) {
      updatedExpenses[tripId] = updatedExpenses[tripId].filter((e) => e.id !== expenseId)
    }
    setTripExpenses(updatedExpenses)
    localStorage.setItem("tripExpenses", JSON.stringify(updatedExpenses))
  }

  const updateExpense = (expenseId: string, updates: Partial<Omit<Expense, "id" | "tripId" | "createdAt">>) => {
    const updatedExpenses = { ...tripExpenses }
    for (const tripId in updatedExpenses) {
      updatedExpenses[tripId] = updatedExpenses[tripId].map((expense) =>
        expense.id === expenseId ? { ...expense, ...updates } : expense,
      )
    }
    setTripExpenses(updatedExpenses)
    localStorage.setItem("tripExpenses", JSON.stringify(updatedExpenses))
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    trips,
    addTrip,
    updateTrip,
    addTripPlayer,
    getTripPlayers,
    getTrip,
    removeTripPlayer,
    updateTripPlayer,
    addRound,
    getRounds,
    deleteRound,
    addTeam,
    getTeams,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    addFoursome,
    getFoursomes,
    deleteFoursome,
    updateFoursome,
    addMatch,
    getMatches,
    getMatchesByFoursome,
    deleteMatch,
    addMatchScore,
    getMatchScore,
    updateHoleScore,
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    tripPlayers,
    foursomes: Object.values(roundFoursomes).flat(),
    rounds: Object.values(tripRounds).flat(),
    teams: Object.values(tripTeams).flat(),
    tripRounds,
    matchScores,
    roundMatches,
    updateMatchStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
