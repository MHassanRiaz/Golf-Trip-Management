"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

interface Settlement {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export default function SettleUpPage() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId") || ""
  const { getExpenses, getParticipants, getTrip } = useAuth()

  const trip = getTrip(tripId)
  const participants = getParticipants(tripId)
  const expenses = getExpenses(tripId)

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip not found</p>
        </main>
      </div>
    )
  }

  // Calculate balances
  const balances: Record<string, number> = {}

  // Initialize balances
  participants.forEach((p) => {
    balances[p.id] = 0
  })

  // Calculate who owes what
  expenses.forEach((expense) => {
    // Person who paid increases their balance
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount

    if (expense.splitType === "equal") {
      const splitAmount = expense.amount / expense.splitWith.length
      expense.splitWith.forEach((personId) => {
        balances[personId] = (balances[personId] || 0) - splitAmount
      })
    } else if (expense.splitType === "custom" && expense.customSplits) {
      Object.entries(expense.customSplits).forEach(([personId, amount]) => {
        balances[personId] = (balances[personId] || 0) - amount
      })
    }
  })

  // Calculate settlements using greedy algorithm
  const settlements: Settlement[] = []
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([id, balance]) => ({ id, balance }))
    .sort((a, b) => a.balance - b.balance)

  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([id, balance]) => ({ id, balance }))
    .sort((a, b) => b.balance - a.balance)

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(-debtor.balance, creditor.balance)

    if (amount > 0.01) {
      settlements.push({
        from: debtor.id,
        fromName: participants.find((p) => p.id === debtor.id)?.name || "Unknown",
        to: creditor.id,
        toName: participants.find((p) => p.id === creditor.id)?.name || "Unknown",
        amount: amount,
      })
    }

    debtor.balance += amount
    creditor.balance -= amount

    if (Math.abs(debtor.balance) < 0.01) i++
    if (Math.abs(creditor.balance) < 0.01) j++
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/expenses?tripId=${tripId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settle Up</h1>
          <p className="text-muted-foreground mt-2">{trip.name} - Who owes whom</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-foreground mt-1">${totalExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Transactions Needed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{settlements.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="text-2xl font-bold text-foreground mt-1">{participants.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Settlements */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Required Payments</CardTitle>
            <CardDescription>
              {settlements.length === 0
                ? "Everyone is settled up!"
                : "Complete these transactions to settle all expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No settlements needed. All expenses are balanced!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{settlement.fromName}</p>
                      <p className="text-xs text-muted-foreground">Owes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 bg-primary/10 rounded-lg">
                        <p className="text-lg font-bold text-primary">${settlement.amount.toFixed(2)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-medium text-foreground">{settlement.toName}</p>
                      <p className="text-xs text-muted-foreground">Receives</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Balances */}
        <Card className="border-border/50 mt-6">
          <CardHeader>
            <CardTitle>Individual Balances</CardTitle>
            <CardDescription>Net balance for each participant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((participant) => {
                const balance = balances[participant.id] || 0
                const isPositive = balance > 0.01
                const isNegative = balance < -0.01

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <span className="font-medium text-foreground">{participant.name}</span>
                    <span
                      className={`font-semibold ${
                        isPositive ? "text-accent" : isNegative ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {isPositive ? "+" : ""}${Math.abs(balance).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
