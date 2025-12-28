import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"

// Helper function to get players from localStorage
async function getPlayersFromStorage(req: AuthenticatedRequest) {
  // In a real implementation, you would get this from the request or context
  // For demo purposes, we'll simulate getting from localStorage
  const players = JSON.parse(localStorage?.getItem('players') || '[]')
  return players.filter((player: any) => player.userId === req.user!.userId)
}

// Helper function to save players to localStorage
async function savePlayersToStorage(players: any[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('players', JSON.stringify(players))
  }
}

async function getHandler(req: AuthenticatedRequest, context: any) {
  try {
    const { playerId } = context.params
    const players = await getPlayersFromStorage(req)
    const player = players.find((p: any) => p.id === playerId)

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Check authorization
    if (player.userId !== req.user!.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      id: player.id,
      name: player.name,
      ghinNumber: player.ghinNumber,
      handicapIndex: player.handicapIndex,
      email: player.email,
      phone: player.phone,
      createdAt: player.createdAt,
    })
  } catch (error) {
    console.error("Get player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function putHandler(req: AuthenticatedRequest, context: any) {
  try {
    const { playerId } = context.params
    const body = await req.json()
    const { name, ghinNumber, handicapIndex, email, phone } = body

    if (!name || handicapIndex === undefined) {
      return NextResponse.json({ error: "Name and handicap index are required" }, { status: 400 })
    }

    if (handicapIndex < 0 || handicapIndex > 36) {
      return NextResponse.json({ error: "Handicap must be between 0 and 36" }, { status: 400 })
    }

    const players = await getPlayersFromStorage(req)
    const playerIndex = players.findIndex((p: any) => p.id === playerId)

    if (playerIndex === -1 || players[playerIndex].userId !== req.user!.userId) {
      return NextResponse.json({ error: "Player not found or unauthorized" }, { status: 404 })
    }

    // Update player
    const updatedPlayer = {
      ...players[playerIndex],
      name,
      ghinNumber: ghinNumber || null,
      handicapIndex: Number.parseFloat(handicapIndex),
      email: email || null,
      phone: phone || null,
    }

    players[playerIndex] = updatedPlayer
    await savePlayersToStorage(players)

    return NextResponse.json({
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      ghinNumber: updatedPlayer.ghinNumber,
      handicapIndex: updatedPlayer.handicapIndex,
      email: updatedPlayer.email,
      phone: updatedPlayer.phone,
      createdAt: updatedPlayer.createdAt,
    })
  } catch (error) {
    console.error("Update player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function deleteHandler(req: AuthenticatedRequest, context: any) {
  try {
    const { playerId } = context.params

    const players = await getPlayersFromStorage(req)
    const player = players.find((p: any) => p.id === playerId)

    if (!player || player.userId !== req.user!.userId) {
      return NextResponse.json({ error: "Player not found or unauthorized" }, { status: 404 })
    }

    // Remove player
    const updatedPlayers = players.filter((p: any) => p.id !== playerId)
    await savePlayersToStorage(updatedPlayers)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete player error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)
export const DELETE = withAuth(deleteHandler)