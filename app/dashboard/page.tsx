"use client"

import { Navigation } from "@/components/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Clock,
  Users,
  CheckCircle,
  DollarSign,
  Trophy,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

function getStatusBadge(status: string) {
  const styles = {
    active:
      "bg-primary/10 text-primary border border-primary/30",
    upcoming:
      "bg-accent/10 text-accent border border-accent/30",
    completed:
      "bg-muted text-muted-foreground border border-border/60",
  }
  return styles[status as keyof typeof styles] || styles.active
}

export default function DashboardPage() {
  const {
    trips,
    getRounds,
    getParticipants,
    getExpenses,
    isAuthenticated,
    isLoading,
  } = useAuth()

  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const activeTrips = trips.filter(t => t.status === "active").length
  const completedTrips = trips.filter(t => t.status === "completed").length

  const totalParticipants = trips.reduce(
    (sum, trip) => sum + getParticipants(trip.id).length,
    0
  )

  const totalExpenses = trips.reduce((sum, trip) => {
    return (
      sum +
      getExpenses(trip.id).reduce(
        (eSum, e) => eSum + e.amount,
        0
      )
    )
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your golf trips and events
            </p>
          </div>

          <Link href="/trips/new">
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Trips" value={activeTrips} icon={Clock} />
          <StatCard label="Players" value={totalParticipants} icon={Users} />
          <StatCard label="Completed" value={completedTrips} icon={CheckCircle} />
          <StatCard
            label="Expenses"
            value={`$${totalExpenses.toFixed(0)}`}
            icon={DollarSign}
          />
        </div>

        {/* Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Your Trips</CardTitle>
            <CardDescription>
              Recent and upcoming golf trips
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {trips.length === 0 ? (
              <EmptyTrips />
            ) : (
              trips.map(trip => {
                const participants = getParticipants(trip.id)
                const rounds = getRounds(trip.id)

                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="block"
                  >
                    <div className="relative border rounded-xl p-4 hover:bg-muted/30 transition">

                      {/* Status badge (top-right, small) */}
                      <span
                        className={`absolute top-3 right-3 px-2 py-0.5 text-xs rounded-md ${getStatusBadge(
                          trip.status
                        )}`}
                      >
                        {trip.status}
                      </span>

                      {/* Title */}
                      <h3 className="font-semibold text-lg truncate whitespace-nowrap mb-2">
                        {trip.name}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-3">
                        {trip.location}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {participants.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {rounds.length} rounds
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {trip.startDate}
                        </span>
                      </div>

                      {/* View details at bottom */}
                      <Button
                        variant="outline"
                        className="w-full sm:w-fit"
                      >
                        View Details
                      </Button>
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/* ---------- Helper Components ---------- */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: any
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function EmptyTrips() {
  return (
    <div className="text-center py-12">
      <Trophy className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">
        No trips yet. Create your first golf trip!
      </p>
      <Link href="/trips/new">
        <Button>Create First Trip</Button>
      </Link>
    </div>
  )
}
