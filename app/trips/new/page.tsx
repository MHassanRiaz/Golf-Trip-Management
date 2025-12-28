"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAllVenues, type Venue } from "@/lib/venue-storage"

export default function NewTripPage() {
  const router = useRouter()
  const { addTrip } = useAuth()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [formData, setFormData] = useState({
    name: "",
    venueId: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  useEffect(() => {
    const loadedVenues = getAllVenues()
    setVenues(loadedVenues)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      addTrip({
        name: formData.name,
        venueId: formData.venueId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
      })

      console.log("[v0] Trip created successfully:", formData)
      router.push("/trips")
    } catch (error) {
      console.error("[v0] Error creating trip:", error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/trips"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Trip</h1>
          <p className="text-muted-foreground mt-2">Set up a new golf trip with venue and dates</p>
        </div>

        {/* Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">
                    Trip Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Myrtle Beach 2025"
                    className="mt-2 bg-input border-border"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="venueId" className="text-foreground">
                    Venue
                  </Label>
                  {venues.length === 0 ? (
                    <div className="mt-2 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                      No venues created yet.{" "}
                      <Link href="/venues/new" className="text-primary hover:underline">
                        Create a venue first
                      </Link>
                    </div>
                  ) : (
                    <select
                      id="venueId"
                      name="venueId"
                      value={formData.venueId}
                      onChange={handleChange}
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select a venue</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.city}, {venue.country}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add any additional details about the trip..."
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground">Trip Dates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-foreground">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="mt-2 bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-foreground">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="mt-2 bg-input border-border"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Link href="/trips" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading || venues.length === 0}
                >
                  {loading ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
