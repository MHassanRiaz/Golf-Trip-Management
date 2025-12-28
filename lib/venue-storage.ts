export interface Hole {
  id: string
  number: number
  par: number
  handicap: number
  complexity: "easy" | "medium" | "hard"
}

export interface Venue {
  id: string
  name: string
  city: string
  country: string
  holes: Hole[]
  createdAt: string
}

const STORAGE_KEY = "ginapp_venues"

export function getVenues(): Venue[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const getAllVenues = getVenues

export function getVenueById(id: string): Venue | null {
  const venues = getVenues()
  return venues.find((v) => v.id === id) || null
}

export const getVenue = getVenueById

export function createVenue(data: Omit<Venue, "id" | "createdAt">): Venue {
  const venues = getVenues()
  const newVenue: Venue = {
    ...data,
    id: `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  venues.push(newVenue)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(venues))
  return newVenue
}

export function updateVenue(id: string, data: Partial<Omit<Venue, "id" | "createdAt">>): Venue | null {
  const venues = getVenues()
  const index = venues.findIndex((v) => v.id === id)
  if (index === -1) return null

  const updated: Venue = { ...venues[index], ...data }
  venues[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(venues))
  return updated
}

export function deleteVenue(id: string): boolean {
  const venues = getVenues()
  const filtered = venues.filter((v) => v.id !== id)
  if (filtered.length === venues.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Initialize with sample data if empty
export function initializeSampleVenues(): void {
  const venues = getVenues()
  if (venues.length === 0) {
    const sampleVenues: Venue[] = [
      {
        id: "venue_sample_1",
        name: "Pebble Beach Golf Links",
        city: "Pebble Beach",
        country: "United States",
        holes: Array.from({ length: 18 }, (_, i) => ({
          id: `hole_${i + 1}`,
          number: i + 1,
          par: i < 9 ? (i % 2 === 0 ? 4 : 3) : i % 2 === 0 ? 4 : 5,
          handicap: i + 1,
          complexity: i < 6 ? "easy" : i < 12 ? "medium" : "hard",
        })),
        createdAt: new Date().toISOString(),
      },
      {
        id: "venue_sample_2",
        name: "St Andrews",
        city: "St Andrews",
        country: "Scotland",
        holes: Array.from({ length: 18 }, (_, i) => ({
          id: `hole_${i + 1}`,
          number: i + 1,
          par: i < 9 ? (i % 2 === 0 ? 4 : 3) : i % 2 === 0 ? 4 : 5,
          handicap: i + 1,
          complexity: i < 6 ? "easy" : i < 12 ? "medium" : "hard",
        })),
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleVenues))
  }
}
