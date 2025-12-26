"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function NewRoundPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const { addRound, getTeams, getRounds } = useAuth()

  const teams = getTeams(tripId)
  const existingRounds = getRounds(tripId)

  const [formData, setFormData] = useState({
    number: existingRounds.length + 1,
    course: "",
    date: "",
    teeBox: "White",
    format: "2v2" as "2v2" | "1v1",
    drinkingMode: false,
    teamIds: [] as string[],
  })

  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "number"
            ? Number.parseInt(value)
            : value,
    }))
  }

  const handleTeamToggle = (teamId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId) ? prev.teamIds.filter((id) => id !== teamId) : [...prev.teamIds, teamId],
    }))
  }

  const handleSelectAllTeams = () => {
    if (formData.teamIds.length === teams.length) {
      setFormData((prev) => ({ ...prev, teamIds: [] }))
    } else {
      setFormData((prev) => ({ ...prev, teamIds: teams.map((t) => t.id) }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.course.trim() || !formData.date.trim()) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.teamIds.length === 0) {
      setError("Please select at least one team for this round")
      return
    }

    addRound(tripId, {
      ...formData,
      status: "planned",
    })

    router.push(`/trips/${tripId}?tab=rounds`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/trips/${tripId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trip
        </Link>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Create New Round</CardTitle>
            <CardDescription>Add a new golf round with complete details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Round Number *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="number"
                    min="1"
                    value={formData.number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    readOnly
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Auto-assigned</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Round number is automatically assigned sequentially
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Course Name *</label>
                <input
                  type="text"
                  name="course"
                  placeholder="e.g., Ocean Pines Golf Club"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tee Box</label>
                <select
                  name="teeBox"
                  value={formData.teeBox}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Gold">Gold</option>
                  <option value="Blue">Blue</option>
                  <option value="White">White</option>
                  <option value="Red">Red</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Format</label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="2v2">2v2 Best Ball</option>
                  <option value="1v1">1v1 Singles</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  2v2 creates 1 match per foursome • 1v1 creates 2 matches per foursome
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Select Teams * {teams.length > 0 && `(${formData.teamIds.length}/${teams.length})`}
                  </label>
                  {teams.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSelectAllTeams}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {formData.teamIds.length === teams.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {teams.length === 0 ? (
                  <div className="p-4 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground text-center">
                    No teams created yet. Please create teams first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all bg-card hover:bg-accent/5"
                      >
                        <input
                          type="checkbox"
                          checked={formData.teamIds.includes(team.id)}
                          onChange={() => handleTeamToggle(team.id)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="font-medium text-foreground">{team.name}</span>
                          <span className="text-xs text-muted-foreground">({team.members.length} members)</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Select which teams will participate in this round</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <label className="block text-sm font-medium text-foreground">Drinking Mode</label>
                  <p className="text-xs text-muted-foreground mt-1">Track drink counts for additional points</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="drinkingMode"
                    checked={formData.drinkingMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Link href={`/trips/${tripId}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition"
                >
                  Create Round
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
