"use client"

import type React from "react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import { getVenueById, updateVenue, type Hole } from "@/lib/venue-storage"

export default function EditVenuePage() {
  const router = useRouter()
  const params = useParams()
  const venueId = params.venueId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    country: "",
  })
  const [holes, setHoles] = useState<Hole[]>([])
  const [canEditHoleCount, setCanEditHoleCount] = useState(false)
  const [newHoleCount, setNewHoleCount] = useState(0)

  useEffect(() => {
    const venue = getVenueById(venueId)
    if (venue) {
      setFormData({
        name: venue.name,
        city: venue.city,
        country: venue.country,
      })
      setHoles(venue.holes)
      setIsLoading(false)
    } else {
      setError("Venue not found")
      setIsLoading(false)
    }
  }, [venueId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleHoleChange = (index: number, field: keyof Hole, value: any) => {
    const updated = [...holes]
    updated[index] = { ...updated[index], [field]: value }
    setHoles(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.city.trim() || !formData.country.trim()) {
      setError("Name, City, and Country are required")
      return
    }

    try {
      setIsSaving(true)
      updateVenue(venueId, {
        name: formData.name.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        holes,
      })

      router.push("/venues")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update venue")
    } finally {
      setIsSaving(false)
    }
  }

  const addOrRemoveHoles = (newCount: number) => {
    if (newCount < 1 || newCount > 18) {
      setError("Number of holes must be between 1 and 18")
      return
    }

    if (newCount > holes.length) {
      const newHoles = Array.from({ length: newCount - holes.length }, (_, i) => {
        const holeNum = holes.length + i + 1
        return {
          id: `hole_${holeNum}`,
          number: holeNum,
          par: i % 2 === 0 ? 4 : 3,
          handicap: holeNum,
          complexity: "medium" as const,
        }
      })
      setHoles([...holes, ...newHoles])
    } else if (newCount < holes.length) {
      setHoles(holes.slice(0, newCount))
    }
    setCanEditHoleCount(false)
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading venue...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/venues"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>

        <div className="space-y-3 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Venue</h1>
          <p className="text-muted-foreground">Update venue details and hole configuration</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Venue Information Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Venue Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-foreground">
                  Venue Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Pebble Beach Golf Links"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-10 border-border/60 bg-input focus:border-primary"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-medium text-foreground">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g., Pebble Beach"
                    value={formData.city}
                    onChange={handleChange}
                    className="h-10 border-border/60 bg-input focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="font-medium text-foreground">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g., United States"
                    value={formData.country}
                    onChange={handleChange}
                    className="h-10 border-border/60 bg-input focus:border-primary"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holes Configuration Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Configure {holes.length} Holes</CardTitle>
              {!canEditHoleCount && (
                <Button
                  type="button"
                  onClick={() => {
                    setCanEditHoleCount(true)
                    setNewHoleCount(holes.length)
                  }}
                  variant="outline"
                  className="border-border/60 bg-transparent text-sm"
                >
                  Change Count
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {canEditHoleCount && (
                <div className="p-4 border border-border/40 rounded-lg bg-muted/20 space-y-3">
                  <Label htmlFor="new-hole-count" className="font-medium text-foreground text-sm">
                    Select Number of Holes (1-18)
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="new-hole-count"
                      type="number"
                      min="1"
                      max="18"
                      value={newHoleCount}
                      onChange={(e) => setNewHoleCount(Math.min(18, Math.max(1, Number(e.target.value))))}
                      className="h-10 border-border/60 bg-input w-32 focus:border-primary"
                    />
                    <Button
                      type="button"
                      onClick={() => addOrRemoveHoles(newHoleCount)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Apply
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCanEditHoleCount(false)}
                      variant="outline"
                      className="border-border/60 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {holes.map((hole, index) => (
                  <div
                    key={hole.id}
                    className="p-4 border border-border/40 rounded-lg bg-card/50 hover:bg-card/80 hover:border-border/60 transition-colors"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Hole</Label>
                        <div className="text-2xl font-bold text-primary">{hole.number}</div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`par_${index}`} className="text-xs font-medium text-muted-foreground">
                          Par
                        </Label>
                        <select
                          id={`par_${index}`}
                          value={hole.par}
                          onChange={(e) => handleHoleChange(index, "par", Number(e.target.value))}
                          className="h-9 px-2 rounded text-sm border border-border/60 bg-input text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`handicap_${index}`} className="text-xs font-medium text-muted-foreground">
                          Handicap
                        </Label>
                        <Input
                          id={`handicap_${index}`}
                          type="number"
                          min="1"
                          max="18"
                          value={hole.handicap}
                          onChange={(e) => handleHoleChange(index, "handicap", Number(e.target.value))}
                          className="h-9 border-border/60 bg-input px-2 text-sm focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`complexity_${index}`} className="text-xs font-medium text-muted-foreground">
                          Difficulty
                        </Label>
                        <select
                          id={`complexity_${index}`}
                          value={hole.complexity}
                          onChange={(e) => handleHoleChange(index, "complexity", e.target.value)}
                          className="h-9 px-2 rounded text-sm border border-border/60 bg-input text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Link href="/venues">
              <Button type="button" variant="outline" className="border-border/60 bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
