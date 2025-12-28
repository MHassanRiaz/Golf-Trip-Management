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
import { createPlayer } from "@/lib/player-storage"

export default function CreatePlayerPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ghinNumber: "",
    email: "",
    handicapIndex: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.handicapIndex) {
      setError("Name and Handicap Index are required")
      return
    }

    if (Number.isNaN(Number(formData.handicapIndex))) {
      setError("Handicap Index must be a valid number")
      return
    }

    try {
      setIsLoading(true)
      createPlayer({
        name: formData.name.trim(),
        ghinNumber: formData.ghinNumber.trim() || null,
        email: formData.email.trim() || null,
        handicapIndex: Number(formData.handicapIndex),
      })

      router.push("/players")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create player")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/players" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Player Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  className="border-border/60 bg-input"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ghinNumber" className="text-foreground">
                    GHIN Number
                  </Label>
                  <Input
                    id="ghinNumber"
                    name="ghinNumber"
                    placeholder="e.g., 123456789"
                    value={formData.ghinNumber}
                    onChange={handleChange}
                    className="border-border/60 bg-input"
                  />
                  <p className="text-xs text-muted-foreground">Optional - GHIN number for official handicaps</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handicapIndex" className="text-foreground">
                    Handicap Index
                  </Label>
                  <Input
                    id="handicapIndex"
                    name="handicapIndex"
                    type="number"
                    placeholder="0.0"
                    step="0.1"
                    value={formData.handicapIndex}
                    onChange={handleChange}
                    className="border-border/60 bg-input"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Required - Player's handicap index</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-border/60 bg-input"
                />
                <p className="text-xs text-muted-foreground">Optional - Contact information</p>
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? "Creating..." : "Create Player"}
                </Button>
                <Link href="/players">
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
