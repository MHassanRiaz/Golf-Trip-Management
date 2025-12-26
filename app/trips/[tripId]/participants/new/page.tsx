"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, User, Award, Hash, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function AddParticipantPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const { addParticipant, getTrip, getTeams } = useAuth()
  const trip = getTrip(tripId)
  const teams = getTeams(tripId)

  const [formData, setFormData] = useState({
    ghin: "",
    name: "",
    handicap: "",
    team: "",
    details: "",
  })

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.ghin.trim()) {
      setError("GHIN# is required")
      return
    }

    if (!formData.name.trim()) {
      setError("Player name is required")
      return
    }

    if (!formData.handicap || isNaN(Number(formData.handicap))) {
      setError("Valid handicap is required")
      return
    }

    if (Number(formData.handicap) < 0 || Number(formData.handicap) > 36) {
      setError("Handicap must be between 0 and 36")
      return
    }

    if (teams.length > 0 && !formData.team) {
      setError("Please assign the player to a team")
      return
    }

    setIsSubmitting(true)

    try {
      addParticipant(tripId, {
        ghin: formData.ghin.trim(),
        name: formData.name.trim(),
        handicap: Number(formData.handicap),
        team: formData.team || "Unassigned",
        details: formData.details.trim() || undefined,
      })

      router.push(`/trips/${tripId}?tab=participants`)
    } catch (err) {
      setError("Failed to add participant")
      console.error("[v0] Error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trip
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add Player</h1>
            <p className="text-muted-foreground mt-1">{trip.name}</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <CardTitle className="text-xl">Player Details</CardTitle>
            <CardDescription>Add a new participant to your golf trip</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label htmlFor="ghin" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Hash className="w-4 h-4 text-primary" />
                  GHIN# *
                </label>
                <Input
                  type="text"
                  id="ghin"
                  name="ghin"
                  placeholder="1234567"
                  value={formData.ghin}
                  onChange={handleChange}
                  className="w-full h-11 border-2 focus:border-primary transition-colors"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-2">Golf Handicap and Information Network ID</p>
              </div>

              {/* Player Name */}
              <div className="group">
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <User className="w-4 h-4 text-primary" />
                  Player Name *
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 border-2 focus:border-primary transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Handicap */}
              <div className="group">
                <label
                  htmlFor="handicap"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
                >
                  <Award className="w-4 h-4 text-primary" />
                  Handicap Index *
                </label>
                <Input
                  type="number"
                  id="handicap"
                  name="handicap"
                  placeholder="12.4"
                  step="0.1"
                  min="0"
                  max="36"
                  value={formData.handicap}
                  onChange={handleChange}
                  className="w-full h-11 border-2 focus:border-primary transition-colors"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-2">Handicap index between 0.0 and 36.0</p>
              </div>

              {/* Team Assignment */}
              <div className="group">
                <label htmlFor="team" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  Team Assignment {teams.length > 0 ? "*" : ""}
                </label>
                {teams.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                    <p className="mb-2">No teams created yet.</p>
                    <Link href={`/trips/${tripId}/teams/new`}>
                      <Button type="button" variant="outline" size="sm" className="bg-transparent">
                        Create Teams First
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <select
                      id="team"
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      disabled={isSubmitting}
                      required={teams.length > 0}
                    >
                      <option value="">Select a team...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.name}>
                          {team.name} ({team.members.length} members)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">Assign this player to one of the two teams</p>
                  </>
                )}
              </div>

              {/* Details */}
              <div>
                <label htmlFor="details" className="block text-sm font-semibold text-foreground mb-2">
                  Additional Notes
                  <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  id="details"
                  name="details"
                  placeholder="Preferred tee time, dietary restrictions, special requests..."
                  value={formData.details}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors min-h-28 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/30 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href={`/trips/${tripId}`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-2 hover:bg-muted bg-transparent"
                    type="button"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 font-semibold shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Player"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
