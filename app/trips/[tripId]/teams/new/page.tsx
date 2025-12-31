"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Calendar, Users, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewTripPage() {
  const router = useRouter()
  const { isAuthenticated, addTrip } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.name.trim()) {
      setError("Trip name is required")
      return
    }

    if (!formData.location.trim()) {
      setError("Location is required")
      return
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Start and end dates are required")
      return
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)

    if (startDate > endDate) {
      setError("Start date must be before end date")
      return
    }

    setIsSubmitting(true)

    try {
      // Add trip using auth context
      addTrip({
        name: formData.name.trim(),
        venueId: formData.location.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim(),
        // participants: 0, // Will be updated when players are added
      })

      // Redirect to trips page
      router.push("/trips")
    } catch (err) {
      setError("Failed to create trip")
      console.error("[v0] Error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Trip</h1>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <CardTitle className="text-xl">Trip Details</CardTitle>
            <CardDescription>Create a new golf trip for your group</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Name */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Trip Name *
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Annual Golf Trip 2024"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 border-2 focus:border-primary transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location *
                </Label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Myrtle Beach, SC"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full h-11 border-2 focus:border-primary transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Start Date *
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full h-11 border-2 focus:border-primary transition-colors"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    End Date *
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full h-11 border-2 focus:border-primary transition-colors"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Annual golf trip with the buddies..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full min-h-[100px] border-2 focus:border-primary transition-colors resize-none"
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
                <Link href="/trips" className="flex-1">
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
                  {isSubmitting ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}