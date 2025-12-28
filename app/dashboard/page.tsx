"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, CheckCircle, DollarSign, Trophy, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getVenue } from "@/lib/venue-storage"

function getStatusBadge(status: string) {
  const styles = {
    active: "bg-primary/10 text-primary border border-primary/30 shadow-sm shadow-primary/10",
    upcoming: "bg-accent/10 text-accent border border-accent/30 shadow-sm shadow-accent/10",
    completed: "bg-muted text-muted-foreground border border-border/60",
  }
  return styles[status as keyof typeof styles] || styles.active
}

export default function DashboardPage() {
  const { trips, getRounds, getExpenses } = useAuth()

  const activeTrips = trips.filter((t) => t.status === "active").length
  const completedTrips = trips.filter((t) => t.status === "completed").length
  const totalExpenses = trips.reduce((sum, trip) => {
    const expenses = getExpenses(trip.id)
    return sum + expenses.reduce((expSum, exp) => expSum + exp.amount, 0)
  }, 0)

  const stats = [
    { label: "Active Trips", value: activeTrips.toString(), icon: Clock, color: "primary" },
    { label: "Total Trips", value: trips.length.toString(), icon: Trophy, color: "accent" },
    { label: "Completed Trips", value: completedTrips.toString(), icon: CheckCircle, color: "primary" },
    { label: "Total Expenses", value: `$${totalExpenses.toFixed(0)}`, icon: DollarSign, color: "accent" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your golf trips and events</p>
          </div>
          <Link href="/trips/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all px-6">
              <Plus className="w-4 h-4" />
              New Trip
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            const colorClass = stat.color === "primary" ? "primary" : "accent"
            return (
              <Card
                key={idx}
                className="border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl ${colorClass === "primary" ? "bg-primary/10" : "bg-accent/10"} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className={`w-6 h-6 ${colorClass === "primary" ? "text-primary" : "text-accent"}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-border/60 shadow-md">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Your Trips</CardTitle>
                <CardDescription className="text-base">Recent and upcoming golf trips</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-6 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg text-muted-foreground mb-6">No trips yet. Create your first golf trip!</p>
                <Link href="/trips/new">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6">
                    <Plus className="w-4 h-4" />
                    Create First Trip
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => {
                  const rounds = getRounds(trip.id)
                  const venue = getVenue(trip.venueId)

                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="group p-6 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer block bg-gradient-to-br from-card to-card/50"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {trip.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusBadge(trip.status)}`}
                            >
                              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-base text-muted-foreground mb-4">
                            {venue ? `${venue.name} - ${venue.city}, ${venue.country}` : "Unknown Venue"}
                          </p>
                          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              {rounds.length} rounds
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {trip.startDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
