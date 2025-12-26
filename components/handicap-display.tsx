"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  generateHoleStrokeAllocation,
  determineStrokeAllocation,
  calculateMatchHandicap,
  STANDARD_STROKE_INDEX,
} from "@/lib/handicap-engine"

interface Player {
  id: string
  name: string
  handicap: number
}

interface HandicapDisplayProps {
  team1Players: Player[]
  team2Players: Player[]
  format: "2v2" | "1v1"
}

export function HandicapDisplay({ team1Players, team2Players, format }: HandicapDisplayProps) {
  const matchHandicap = calculateMatchHandicap(team1Players, team2Players, format)
  const { receivingTeam, strokes } = determineStrokeAllocation(team1Players, team2Players, format)
  const holeAllocations = generateHoleStrokeAllocation(team1Players, team2Players, format, STANDARD_STROKE_INDEX)

  const team1Combined = team1Players.reduce((sum, p) => sum + p.handicap, 0)
  const team2Combined = team2Players.reduce((sum, p) => sum + p.handicap, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Match Handicap Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Team 1</p>
              <div className="space-y-1">
                {team1Players.map((p) => (
                  <p key={p.id} className="text-sm text-foreground">
                    {p.name} ({p.handicap})
                  </p>
                ))}
                {format === "2v2" && <p className="text-sm font-semibold text-primary">Combined: {team1Combined}</p>}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Team 2</p>
              <div className="space-y-1">
                {team2Players.map((p) => (
                  <p key={p.id} className="text-sm text-foreground">
                    {p.name} ({p.handicap})
                  </p>
                ))}
                {format === "2v2" && <p className="text-sm font-semibold text-primary">Combined: {team2Combined}</p>}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Match Handicap</span>
              <span className="font-bold text-foreground">{matchHandicap} strokes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receiving Strokes</span>
              <Badge variant={receivingTeam === 1 ? "default" : "secondary"}>
                Team {receivingTeam} receives {strokes} stroke{strokes !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hole-by-Hole Allocation */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Stroke Allocation by Hole</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {holeAllocations.map((allocation) => {
              const hasStroke = allocation.team1Strokes > 0 || allocation.team2Strokes > 0

              return (
                <div
                  key={allocation.hole}
                  className={`p-3 rounded-lg border text-center ${
                    hasStroke ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground mb-1">Hole {allocation.hole}</div>
                  <div className="text-xs text-muted-foreground mb-1">SI: {allocation.strokeIndex}</div>
                  {(allocation.team1Strokes > 0 || allocation.team2Strokes > 0) && (
                    <div className="text-xs font-medium text-primary">
                      {allocation.team1Strokes > 0 && `T1: ${allocation.team1Strokes}`}
                      {allocation.team2Strokes > 0 && `T2: ${allocation.team2Strokes}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Legend:</p>
            <p>SI = Stroke Index (1 = hardest hole, 18 = easiest)</p>
            <p>Highlighted holes indicate where strokes are received</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
