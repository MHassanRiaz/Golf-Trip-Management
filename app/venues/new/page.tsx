"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createVenue, type Hole } from "@/lib/venue-storage"
import { MapPin, ChevronRight } from "lucide-react"
import Navigation from "@/components/navigation"

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
  const [step, setStep] = useState<"details" | "holes">("details")
  const [numberOfHoles, setNumberOfHoles] = useState<number>(18)

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

  const generateHoles = (count: number): Hole[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `hole_${i + 1}`,
      number: i + 1,
      par: i < count / 2 ? (i % 2 === 0 ? 4 : 3) : i % 2 === 0 ? 4 : 5,
      handicap: i + 1,
      complexity: i < count / 3 ? "easy" : i < (count * 2) / 3 ? "medium" : "hard",
    }))
  }

  const handleContinue = () => {
    if (!formData.name.trim() || !formData.city.trim() || !formData.country.trim()) {
      setError("Please fill in all venue details")
      return
    }
    if (numberOfHoles < 1 || numberOfHoles > 18) {
      setError("Number of holes must be between 1 and 18")
      return
    }
    setError(null)
    setHoles(generateHoles(numberOfHoles))
    setStep("holes")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {step === "details" ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <h1 className="text-3xl font-bold text-foreground">Create New Venue</h1>
              </div>
              <p className="text-muted-foreground ml-10">Enter venue details and configure your golf course</p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </div>
            )}

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Venue Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="venue-name" className="font-medium text-foreground">
                    Venue Name
                  </Label>
                  <Input
                    id="venue-name"
                    name="name"
                    placeholder="e.g., Pebble Beach Golf Links"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-10 border-border/60 bg-input focus:border-primary"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue-city" className="font-medium text-foreground">
                      City
                    </Label>
                    <Input
                      id="venue-city"
                      name="city"
                      placeholder="e.g., Pebble Beach"
                      value={formData.city}
                      onChange={handleChange}
                      className="h-10 border-border/60 bg-input focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue-country" className="font-medium text-foreground">
                      Country
                    </Label>
                    <Input
                      id="venue-country"
                      name="country"
                      placeholder="e.g., United States"
                      value={formData.country}
                      onChange={handleChange}
                      className="h-10 border-border/60 bg-input focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Label htmlFor="hole-count" className="font-medium text-foreground">
                    Number of Holes (1-18)
                  </Label>
                  <Input
                    id="hole-count"
                    type="number"
                    min="1"
                    max="18"
                    value={numberOfHoles}
                    onChange={(e) => setNumberOfHoles(Math.min(18, Math.max(1, Number(e.target.value))))}
                    className="h-10 border-border/60 bg-input focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">You can configure each hole on the next step</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Link href="/venues">
                <Button variant="outline" className="border-border/60 bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleContinue} className="bg-primary hover:bg-primary/90 gap-2">
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <h1 className="text-3xl font-bold text-foreground">Configure Holes</h1>
              </div>
              <p className="text-muted-foreground ml-10">Set par, handicap, and complexity for each hole</p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </div>
            )}

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {numberOfHoles} {numberOfHoles === 1 ? "Hole" : "Holes"} Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              <Button
                type="button"
                onClick={() => setStep("details")}
                variant="outline"
                className="border-border/60 bg-transparent"
              >
                Back
              </Button>
              <div className="flex gap-3">
                <Link href="/venues">
                  <Button type="button" variant="outline" className="border-border/60 bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? "Creating..." : "Create Venue"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
