export interface Player {
  id: string
  name: string
  ghinNumber: string | null
  email: string | null
  handicapIndex: number
  createdAt: string
}

const STORAGE_KEY = "ginapp_players"

export function getPlayers(): Player[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getPlayerById(id: string): Player | null {
  const players = getPlayers()
  return players.find((p) => p.id === id) || null
}

export const getPlayer = getPlayerById

export function createPlayer(data: Omit<Player, "id" | "createdAt">): Player {
  const players = getPlayers()
  const newPlayer: Player = {
    ...data,
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  players.push(newPlayer)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  return newPlayer
}

export function updatePlayer(id: string, data: Partial<Omit<Player, "id" | "createdAt">>): Player | null {
  const players = getPlayers()
  const index = players.findIndex((p) => p.id === id)
  if (index === -1) return null

  const updated: Player = { ...players[index], ...data }
  players[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  return updated
}

export function deletePlayer(id: string): boolean {
  const players = getPlayers()
  const filtered = players.filter((p) => p.id !== id)
  if (filtered.length === players.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Initialize with sample data if empty
export function initializeSamplePlayers(): void {
  const players = getPlayers()
  if (players.length === 0) {
    const samplePlayers: Player[] = [
      {
        id: "player_sample_1",
        name: "John Smith",
        ghinNumber: "123456789",
        email: "john@example.com",
        handicapIndex: 8.5,
        createdAt: new Date().toISOString(),
      },
      {
        id: "player_sample_2",
        name: "Jane Doe",
        ghinNumber: "987654321",
        email: "jane@example.com",
        handicapIndex: 12.3,
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePlayers))
  }
}
