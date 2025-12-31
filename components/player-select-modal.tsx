"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getPlayers } from "@/lib/player-storage"

interface PlayerSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (playerId: string) => void
  teams: Array<{ id: string; name: string }>
  excludedPlayerIds?: string[]
}

export function PlayerSelectModal({
  isOpen,
  onClose,
  onSelect,
  teams,
  excludedPlayerIds = [],
}: PlayerSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const allPlayers = getPlayers()

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      if (excludedPlayerIds.includes(player.id)) return false
      const query = searchQuery.toLowerCase()
      return player.name.toLowerCase().includes(query) || (player.ghinNumber && player.ghinNumber.includes(query))
    })
  }, [searchQuery, excludedPlayerIds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-background border-border/50 shadow-lg">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add Player to Trip</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or GHIN number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              ℹ️ Players will be automatically assigned to teams for balanced distribution
            </p>
          </div>

          {/* Players List */}
          <div className="border border-border/50 rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "No players found" : "No players available"}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => onSelect(player.id)}
                    className="w-full p-4 hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {player.ghinNumber ? (
                            <p className="text-xs text-muted-foreground">GHIN: {player.ghinNumber}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No GHIN</p>
                          )}
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            {player.handicapIndex.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
