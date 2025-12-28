"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Edit, MapPin, Flag } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getVenues, deleteVenue, initializeSampleVenues } from "@/lib/venue-storage"
import { Navigation } from "@/components/navigation"

interface Venue {
  id: string
  name: string
  city: string
  country: string
  holes: Array<{ id: string; number: number; par: number; handicap: number; complexity: string }>
  createdAt: string
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = () => {
    try {
      setIsLoading(true)
      initializeSampleVenues()
      const data = getVenues()
      setVenues(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch venues")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (venueId: string) => {
    if (!confirm("Are you sure you want to delete this venue?")) return

    try {
      setDeletingId(venueId)
      if (deleteVenue(venueId)) {
        setVenues(venues.filter((v) => v.id !== venueId))
      } else {
        setError("Failed to delete venue")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete venue")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Venues</h1>
            <p className="text-muted-foreground mt-1">Manage golf courses and their holes</p>
          </div>
          <Link href="/venues/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add Venue
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading venues...</div>
          </div>
        ) : venues.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No venues yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first golf course to start managing venues and holes.
                </p>
                <Link href="/venues/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Venue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card
                key={venue.id}
                className="border-border/50 hover:border-primary/50 h-full transition cursor-pointer hover:shadow-lg"
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {venue.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground line-clamp-1">{venue.name}</h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Display */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{venue.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flag className="w-4 h-4" />
                        <span>{venue.country}</span>
                      </div>
                    </div>

                    {/* Holes Info */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Holes</p>
                      <p className="text-2xl font-bold text-foreground">{venue.holes.length}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Link href={`/venues/${venue.id}/edit`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border/60 bg-transparent hover:bg-muted gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/5 bg-transparent"
                        onClick={() => handleDelete(venue.id)}
                        disabled={deletingId === venue.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
