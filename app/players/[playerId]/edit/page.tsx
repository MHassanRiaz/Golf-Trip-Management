"use client"

import type React from "react"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getPlayerById, updatePlayer } from "@/lib/player-storage"

interface Player {
  id: string
  name: string
  ghinNumber: string | null
  email: string | null
  handicapIndex: number
}

export default function EditPlayerPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.playerId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ghinNumber: "",
    email: "",
    handicapIndex: "",
  })

  useEffect(() => {
    try {
      const player = getPlayerById(playerId)
      if (!player) {
        setError("Player not found")
        return
      }

      setFormData({
        name: player.name,
        ghinNumber: player.ghinNumber || "",
        email: player.email || "",
        handicapIndex: player.handicapIndex.toString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch player")
    } finally {
      setIsLoading(false)
    }
  }, [playerId])

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
      setIsSaving(true)
      updatePlayer(playerId, {
        name: formData.name.trim(),
        ghinNumber: formData.ghinNumber.trim() || null,
        email: formData.email.trim() || null,
        handicapIndex: Number(formData.handicapIndex),
      })

      router.push("/players")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update player")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading player...</div>
      </div>
    )
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
            <CardTitle className="text-2xl">Edit Player</CardTitle>
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
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  {isSaving ? "Saving..." : "Save Changes"}
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
