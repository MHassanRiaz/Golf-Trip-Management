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

const teamColors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Orange", value: "bg-orange-500" },
]

export default function NewTeamPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const { addTeam, getParticipants, getTeams } = useAuth()

  const participants = getParticipants(tripId)
  const existingTeams = getTeams(tripId)

  const [formData, setFormData] = useState({
    name: "",
    color: "bg-blue-500",
    members: [] as string[],
  })

  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      color,
    }))
  }

  const toggleMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter((id) => id !== memberId)
        : [...prev.members, memberId],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Please enter a team name")
      return
    }

    addTeam(tripId, {
      name: formData.name,
      color: formData.color,
      members: formData.members,
    })

    router.push(`/trips/${tripId}?tab=teams`)
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
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>
              Add a new team for this trip. You currently have {existingTeams.length} team
              {existingTeams.length !== 1 ? "s" : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Team Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Team A, The Eagles"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Team Color</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {teamColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorChange(color.value)}
                      className={`w-10 h-10 rounded-lg ${color.value} transition ${
                        formData.color === color.value ? "ring-2 ring-offset-2 ring-foreground" : ""
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Team Members</label>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No participants yet. Add participants first.</p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <label
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.members.includes(participant.id)}
                          onChange={() => toggleMember(participant.id)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">Handicap: {participant.handicap}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
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
                  Create Team
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
