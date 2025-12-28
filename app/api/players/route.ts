import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"

// In-memory storage for demo purposes (shared with the other route)
const playersStorage = new Map<string, any[]>()

// Helper function to get players from storage
async function getPlayersFromStorage(req: AuthenticatedRequest) {
  const userId = req.user!.userId
  return playersStorage.get(userId) || []
}

// Helper function to save players to storage
async function savePlayersToStorage(req: AuthenticatedRequest, players: any[]) {
  const userId = req.user!.userId
  playersStorage.set(userId, players)
  return players
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    const players = await getPlayersFromStorage(req)
    
    // Return formatted players without userId for security
    const formattedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      ghinNumber: player.ghinNumber,
      handicapIndex: player.handicapIndex,
      email: player.email,
      phone: player.phone,
      createdAt: player.createdAt,
    }))

    return NextResponse.json(formattedPlayers)
  } catch (error) {
    console.error("Get players error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { name, ghinNumber, handicapIndex, email, phone } = body

    // Validate required fields
    if (!name || handicapIndex === undefined) {
      return NextResponse.json({ error: "Name and handicap index are required" }, { status: 400 })
    }

    if (handicapIndex < 0 || handicapIndex > 36) {
      return NextResponse.json({ error: "Handicap must be between 0 and 36" }, { status: 400 })
    }

    // Get existing players
    const existingPlayers = await getPlayersFromStorage(req)
    
    // Create new player
    const newPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user!.userId,
      name,
      ghinNumber: ghinNumber || null,
      handicapIndex: Number.parseFloat(handicapIndex),
      email: email || null,
      phone: phone || null,
      createdAt: new Date().toISOString(),
    }

    // Save to storage
    const updatedPlayers = [...existingPlayers, newPlayer]
    await savePlayersToStorage(req, updatedPlayers)

    // Return response without userId for security
    return NextResponse.json({
      id: newPlayer.id,
      name: newPlayer.name,
      ghinNumber: newPlayer.ghinNumber,
      handicapIndex: newPlayer.handicapIndex,
      email: newPlayer.email,
      phone: newPlayer.phone,
      createdAt: newPlayer.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error("Create player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)