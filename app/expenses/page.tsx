"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo } from "react"
import { Plus, DollarSign, Users, TrendingUp, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

const expenseCategories = ["Food", "Drinks", "Transportation", "Lodging", "Green Fees", "Other"]

export default function ExpensesPage() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId") || ""
  const { getExpenses, addExpense, deleteExpense, getTrip, trips } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    category: "Food",
    description: "",
    paidBy: "",
    splitWith: [] as string[],
  })

  const selectedTrip = tripId ? getTrip(tripId) : trips.length > 0 ? getTrip(trips[0].id) : null
  const currentTripId = tripId || (trips.length > 0 ? trips[0].id : "")
  const expenses = currentTripId ? getExpenses(currentTripId) : []
  const participants = selectedTrip?.participantsList || []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSplitWithChange = (participantId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      splitWith: checked ? [...prev.splitWith, participantId] : prev.splitWith.filter((id) => id !== participantId),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTripId) return

    addExpense(currentTripId, {
      amount: Number.parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      paidBy: formData.paidBy,
      splitWith: formData.splitWith,
      date: new Date().toLocaleDateString(),
    })

    setShowForm(false)
    setFormData({ amount: "", category: "Food", description: "", paidBy: "", splitWith: [] })
  }

  const settlements = useMemo(() => {
    if (expenses.length === 0 || participants.length === 0) return []

    const balances: Record<string, number> = {}
    participants.forEach((p) => {
      balances[p.id] = 0
    })

    expenses.forEach((expense) => {
      const splitCount = expense.splitWith.length + 1 // +1 for payer
      const amountPerPerson = expense.amount / splitCount

      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount - amountPerPerson

      expense.splitWith.forEach((personId) => {
        balances[personId] = (balances[personId] || 0) - amountPerPerson
      })
    })

    const settlements: Array<{ from: string; to: string; amount: number }> = []
    const debtors = Object.entries(balances).filter(([, amount]) => amount < -0.01)
    const creditors = Object.entries(balances).filter(([, amount]) => amount > 0.01)

    debtors.forEach(([debtorId, debtAmount]) => {
      let remainingDebt = -debtAmount

      creditors.forEach(([creditorId, creditAmount]) => {
        if (remainingDebt > 0.01 && creditAmount > 0.01) {
          const settlementAmount = Math.min(remainingDebt, creditAmount)

          const debtorName = participants.find((p) => p.id === debtorId)?.name || "Unknown"
          const creditorName = participants.find((p) => p.id === creditorId)?.name || "Unknown"

          settlements.push({
            from: debtorName,
            to: creditorName,
            amount: settlementAmount,
          })

          remainingDebt -= settlementAmount
          balances[creditorId] -= settlementAmount
        }
      })
    })

    return settlements
  }, [expenses, participants])

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const perPerson = participants.length > 0 ? totalExpenses / participants.length : 0

  if (!selectedTrip) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Trips Found</h2>
            <p className="text-muted-foreground mb-6">Create a trip first to start tracking expenses.</p>
            <a href="/trips/new">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Create Trip
              </Button>
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track and settle trip costs • {selectedTrip.name}</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Per Person</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${perPerson.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Settlements Needed</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{settlements.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <Card className="border-border/50 mb-8">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-foreground">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-2 bg-input border-border"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-foreground">
                      Category
                    </Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What's this expense for?"
                    className="mt-2 bg-input border-border"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paidBy" className="text-foreground">
                    Paid By
                  </Label>
                  <select
                    id="paidBy"
                    name="paidBy"
                    value={formData.paidBy}
                    onChange={handleChange}
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select participant</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">Split With</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {participants
                      .filter((p) => p.id !== formData.paidBy)
                      .map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.splitWith.includes(p.id)}
                            onChange={(e) => handleSplitWithChange(p.id, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-foreground">{p.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Add Expense
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="expenses">All Expenses</TabsTrigger>
            <TabsTrigger value="settle">Settle Up</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>All expenses by category and participant</CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No expenses yet</p>
                    <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4" />
                      Add First Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => {
                      const paidByName = participants.find((p) => p.id === expense.paidBy)?.name || "Unknown"
                      const splitWithNames = expense.splitWith
                        .map((id) => participants.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(", ")

                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{expense.description}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Paid by {paidByName} • {expense.category}
                            </p>
                            {splitWithNames && (
                              <p className="text-xs text-muted-foreground mt-2">Split with: {splitWithNames}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">${expense.amount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground mt-1">{expense.date}</p>
                            </div>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 hover:bg-destructive/10 rounded text-destructive transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settle Up Tab */}
          <TabsContent value="settle">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Settlement Summary</CardTitle>
                <CardDescription>Who owes whom and how much</CardDescription>
              </CardHeader>
              <CardContent>
                {settlements.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {expenses.length === 0 ? "Add expenses to see settlements" : "All settled up!"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {settlements.map((settlement, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{settlement.from}</p>
                            <p className="text-sm text-muted-foreground mt-1">owes {settlement.to}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-accent">${settlement.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary">
                        Tip: Use a payment app (Venmo, PayPal, etc.) to settle these amounts.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
