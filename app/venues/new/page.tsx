"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createVenue, type Hole } from "@/lib/venue-storage"

export default function CreateVenuePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    country: "",
  })
  const [holes, setHoles] = useState<Hole[]>(
    Array.from({ length: 18 }, (_, i) => ({
      id: `hole_${i + 1}`,
      number: i + 1,
      par: 4,
      handicap: i + 1,
      complexity: "medium" as const,
    })),
  )

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
      setIsLoading(true)
      createVenue({
        name: formData.name.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        holes,
      })

      router.push("/venues")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/venues" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Venue Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Venue Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Venue Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Pebble Beach Golf Links"
                    value={formData.name}
                    onChange={handleChange}
                    className="border-border/60 bg-input"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g., Pebble Beach"
                      value={formData.city}
                      onChange={handleChange}
                      className="border-border/60 bg-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-foreground">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="e.g., United States"
                      value={formData.country}
                      onChange={handleChange}
                      className="border-border/60 bg-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Holes Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Configure Holes</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {holes.map((hole, index) => (
                    <div key={hole.id} className="p-4 border border-border/50 rounded-lg bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Hole</Label>
                          <div className="text-lg font-semibold text-foreground">{hole.number}</div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`par_${index}`} className="text-xs text-muted-foreground">
                            Par
                          </Label>
                          <select
                            id={`par_${index}`}
                            value={hole.par}
                            onChange={(e) => handleHoleChange(index, "par", Number(e.target.value))}
                            className="px-2 py-1 rounded text-sm border border-border/60 bg-input text-foreground"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`handicap_${index}`} className="text-xs text-muted-foreground">
                            Handicap
                          </Label>
                          <Input
                            id={`handicap_${index}`}
                            type="number"
                            min="1"
                            max="18"
                            value={hole.handicap}
                            onChange={(e) => handleHoleChange(index, "handicap", Number(e.target.value))}
                            className="border-border/60 bg-input px-2 h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`complexity_${index}`} className="text-xs text-muted-foreground">
                            Complexity
                          </Label>
                          <select
                            id={`complexity_${index}`}
                            value={hole.complexity}
                            onChange={(e) => handleHoleChange(index, "complexity", e.target.value)}
                            className="px-2 py-1 rounded text-sm border border-border/60 bg-input text-foreground"
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
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? "Creating..." : "Create Venue"}
                </Button>
                <Link href="/venues">
                  <Button type="button" variant="outline" className="border-border/60 bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
