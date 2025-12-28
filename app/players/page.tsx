"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Edit, Mail, Bold as Golf } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getPlayers, deletePlayer, initializeSamplePlayers } from "@/lib/player-storage"
import { Navigation } from "@/components/navigation"

interface Player {
  id: string
  name: string
  ghinNumber: string | null
  email: string | null
  handicapIndex: number
  createdAt: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = () => {
    try {
      setIsLoading(true)
      initializeSamplePlayers()
      const data = getPlayers()
      setPlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch players")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return

    try {
      setDeletingId(playerId)
      if (deletePlayer(playerId)) {
        setPlayers(players.filter((p) => p.id !== playerId))
      } else {
        setError("Failed to delete player")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player")
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
            <h1 className="text-3xl font-bold text-foreground">Players</h1>
            <p className="text-muted-foreground mt-1">Manage your global player database</p>
          </div>
          <Link href="/players/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add Player
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
            <div className="text-muted-foreground">Loading players...</div>
          </div>
        ) : players.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Golf className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No players yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first golfer to start building your global player database.
                </p>
                <Link href="/players/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Player
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <Card
                key={player.id}
                className="border-border/50 hover:border-primary/50 h-full transition cursor-pointer hover:shadow-lg"
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header with Avatar */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground line-clamp-1">{player.name}</h3>
                            {player.ghinNumber && (
                              <p className="text-xs text-muted-foreground">GHIN: {player.ghinNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Handicap Display */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Handicap Index</p>
                      <p className="text-2xl font-bold text-foreground">{Number(player.handicapIndex).toFixed(1)}</p>
                    </div>

                    {/* Contact Info */}
                    {player.email && (
                      <div className="pt-2 border-t border-border">
                        <a
                          href={`mailto:${player.email}`}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition"
                        >
                          <Mail className="w-4 h-4" />
                          {player.email}
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Link href={`/players/${player.id}/edit`} className="flex-1">
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
                        onClick={() => handleDelete(player.id)}
                        disabled={deletingId === player.id}
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
