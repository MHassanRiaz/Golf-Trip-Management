"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface Participant {
  id: string
  ghin: string // GHIN number - required field
  name: string
  handicap: number
  team: string
  details?: string
}

interface Round {
  id: string
  number: number
  tripId: string
  course: string
  date: string
  format?: "2v2" | "1v1" // Added format field
  drinkingMode?: boolean // Added drinking mode toggle
  teeBox?: string // Added tee box field (e.g., "White", "Blue", "Gold")
  teamIds?: string[] // Teams participating in this round
  status: "planned" | "completed"
  createdAt: string
}

interface Team {
  id: string
  name: string
  tripId: string
  color: string
  members: string[]
  createdAt: string
}

interface Trip {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  participants: number
  description: string
  createdAt: string
  status: "upcoming" | "active" | "completed"
}

interface TripWithParticipants extends Trip {
  participantsList: Participant[]
}

interface Foursome {
  id: string
  roundId: string
  name: string
  players: string[] // participant IDs (must be exactly 4)
  teeTime?: string
  createdAt: string
}

interface Match {
  id: string
  roundId: string
  foursomeId: string
  format: "2v2" | "1v1"
  team1Players: string[] // participant IDs
  team2Players: string[] // participant IDs
  scorer?: string // participant ID assigned as scorer
  matchHandicap?: number // calculated handicap for the match
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
  paidBy: string // participant ID
  splitType: "equal" | "custom" // Added split type field
  splitWith: string[] // participant IDs (for equal split)
  customSplits?: Record<string, number> // For custom splits: participantId -> amount
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
  addParticipant: (tripId: string, participant: Omit<Participant, "id">) => void
  getParticipants: (tripId: string) => Participant[]
  getTrip: (tripId: string) => TripWithParticipants | null
  deleteParticipant: (tripId: string, participantId: string) => void
  updateParticipant: (tripId: string, participantId: string, updates: Partial<Participant>) => void
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
  updateExpense: (expenseId: string, updates: Partial<Omit<Expense, "id" | "tripId" | "createdAt">>) => void // Added update function
  participants: Participant[] // Export participants for easier access
  foursomes: Foursome[] // Export foursomes
  rounds: Round[] // Export rounds
  teams: Team[] // Export teams
  tripParticipants: Record<string, Participant[]>
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
  const [tripParticipants, setTripParticipants] = useState<Record<string, Participant[]>>({})
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

    const storedParticipants = localStorage.getItem("tripParticipants")
    if (storedParticipants) {
      try {
        setTripParticipants(JSON.parse(storedParticipants))
      } catch (error) {
        console.error("[v0] Failed to parse stored participants:", error)
        localStorage.removeItem("tripParticipants")
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

    const storedToken = localStorage.getItem("auth_token")
    if (storedToken && !user) {
      const verifiedUser = verifyToken(storedToken)
      if (verifiedUser) {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            logout()
          }
        }
      } else {
        logout()
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Login failed")
      }

      const { user: userData, token } = await response.json()

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("auth_token", token)
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`
    } catch (err) {
      console.log("[v0] API call failed, using demo mode:", err)
      const demoUser = {
        id: "demo-user-" + Date.now(),
        email: email || "demo@golftrip.com",
        name: email?.split("@")[0] || "Demo User",
      }
      setUser(demoUser)
      localStorage.setItem("user", JSON.stringify(demoUser))
      localStorage.setItem("auth_token", "demo-token-" + Date.now())
      document.cookie = `auth_token=demo-token; path=/; max-age=${7 * 24 * 60 * 60}`
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Signup failed")
      }

      const { user: userData, token } = await response.json()

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("auth_token", token)
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`
    } catch (err) {
      console.log("[v0] API call failed, using demo mode:", err)
      const demoUser = {
        id: "demo-user-" + Date.now(),
        email,
        name,
      }
      setUser(demoUser)
      localStorage.setItem("user", JSON.stringify(demoUser))
      localStorage.setItem("auth_token", "demo-token-" + Date.now())
      document.cookie = `auth_token=demo-token; path=/; max-age=${7 * 24 * 60 * 60}`
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("auth_token")
    document.cookie = "auth_token=; path=/; max-age=0"
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
  }

  const updateTrip = (tripId: string, updates: Partial<Omit<Trip, "id" | "createdAt">>) => {
    const updatedTrips = trips.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip))
    setTrips(updatedTrips)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))
  }

  const addParticipant = (tripId: string, participant: Omit<Participant, "id">) => {
    const newParticipant: Participant = {
      ...participant,
      id: Math.random().toString(36).substr(2, 9),
    }

    const updatedParticipants = {
      ...tripParticipants,
      [tripId]: [...(tripParticipants[tripId] || []), newParticipant],
    }

    setTripParticipants(updatedParticipants)
    localStorage.setItem("tripParticipants", JSON.stringify(updatedParticipants))

    // Update participant count in trip
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId ? { ...trip, participants: updatedParticipants[tripId].length } : trip,
    )
    setTrips(updatedTrips)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))
  }

  const getParticipants = (tripId: string) => {
    return tripParticipants[tripId] || []
  }

  const getTrip = (tripId: string): TripWithParticipants | null => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return null

    return {
      ...trip,
      participantsList: getParticipants(tripId),
    }
  }

  const deleteParticipant = (tripId: string, participantId: string) => {
    const updatedParticipants = {
      ...tripParticipants,
      [tripId]: (tripParticipants[tripId] || []).filter((p) => p.id !== participantId),
    }

    setTripParticipants(updatedParticipants)
    localStorage.setItem("tripParticipants", JSON.stringify(updatedParticipants))

    const updatedTrips = trips.map((trip) =>
      trip.id === tripId ? { ...trip, participants: updatedParticipants[tripId].length } : trip,
    )
    setTrips(updatedTrips)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))
  }

  const updateParticipant = (tripId: string, participantId: string, updates: Partial<Participant>) => {
    const updatedParticipants = {
      ...tripParticipants,
      [tripId]: (tripParticipants[tripId] || []).map((p) => (p.id === participantId ? { ...p, ...updates } : p)),
    }

    setTripParticipants(updatedParticipants)
    localStorage.setItem("tripParticipants", JSON.stringify(updatedParticipants))
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

    // Also delete associated matches
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

    const completedHoles = updatedHoles.filter(
      (h) => h.player1Gross !== undefined || h.player2Gross !== undefined,
    ).length

    const updatedMatchScore: MatchScore = {
      ...matchScore,
      holes: updatedHoles,
      completedHoles,
      updatedAt: new Date().toISOString(),
    }

    const updatedMatchScores = {
      ...matchScores,
      [matchId]: updatedMatchScore,
    }

    setMatchScores(updatedMatchScores)
    localStorage.setItem("matchScores", JSON.stringify(updatedMatchScores))

    if (completedHoles > 0 && completedHoles < 18) {
      updateMatchStatus(matchId, "in-progress")
    } else if (completedHoles === 18) {
      updateMatchStatus(matchId, "completed")
    }
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

  const participants = Object.values(tripParticipants).flat()
  const foursomes = Object.values(roundFoursomes).flat()
  const rounds = Object.values(tripRounds).flat()
  const teams = Object.values(tripTeams).flat()

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        trips,
        addTrip,
        updateTrip,
        addParticipant,
        getParticipants,
        getTrip,
        deleteParticipant,
        updateParticipant,
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
        participants,
        foursomes,
        rounds,
        teams,
        tripParticipants,
        tripRounds,
        matchScores,
        roundMatches,
        updateMatchStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

function verifyToken(token: string): User | null {
  // Placeholder for token verification logic
  return null
}
