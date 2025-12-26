"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function NewExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId") || ""
  const { addExpense, getParticipants, getTrip } = useAuth()

  const trip = getTrip(tripId)
  const participants = getParticipants(tripId)

  const [formData, setFormData] = useState({
    amount: "",
    category: "Food",
    description: "",
    paidBy: "",
    splitType: "equal" as "equal" | "custom",
    splitWith: [] as string[],
    customSplits: {} as Record<string, string>,
    date: new Date().toISOString().split("T")[0],
  })

  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleSplitWith = (participantId: string) => {
    setFormData((prev) => ({
      ...prev,
      splitWith: prev.splitWith.includes(participantId)
        ? prev.splitWith.filter((id) => id !== participantId)
        : [...prev.splitWith, participantId],
    }))
  }

  const handleCustomSplitChange = (participantId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customSplits: {
        ...prev.customSplits,
        [participantId]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.amount || !formData.paidBy || !formData.description.trim()) {
      setError("Please fill in all required fields")
      return
    }

    const amount = Number.parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (formData.splitType === "equal" && formData.splitWith.length === 0) {
      setError("Please select at least one person to split with")
      return
    }

    if (formData.splitType === "custom") {
      const customSplitsNum: Record<string, number> = {}
      let totalCustom = 0

      for (const [id, value] of Object.entries(formData.customSplits)) {
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue) || numValue <= 0) {
          setError(`Invalid amount for ${participants.find((p) => p.id === id)?.name}`)
          return
        }
        customSplitsNum[id] = numValue
        totalCustom += numValue
      }

      if (Math.abs(totalCustom - amount) > 0.01) {
        setError(`Custom splits ($${totalCustom.toFixed(2)}) must equal total amount ($${amount.toFixed(2)})`)
        return
      }

      addExpense(tripId, {
        amount,
        category: formData.category,
        description: formData.description,
        paidBy: formData.paidBy,
        splitType: "custom",
        splitWith: Object.keys(customSplitsNum),
        customSplits: customSplitsNum,
        date: formData.date,
      })
    } else {
      addExpense(tripId, {
        amount,
        category: formData.category,
        description: formData.description,
        paidBy: formData.paidBy,
        splitType: "equal",
        splitWith: formData.splitWith,
        date: formData.date,
      })
    }

    router.push(`/expenses?tripId=${tripId}`)
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Trip not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/expenses?tripId=${tripId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
            <CardDescription>{trip.name} - Track a new expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g., Dinner at restaurant"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Food">Food</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Golf">Golf</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Paid By *</label>
                <select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select who paid</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Split Type</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, splitType: "equal", customSplits: {} }))}
                    className={`p-3 rounded-lg border transition ${
                      formData.splitType === "equal"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium text-sm">Equal Split</div>
                    <div className="text-xs mt-1 opacity-75">Split equally among selected</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, splitType: "custom", splitWith: [] }))}
                    className={`p-3 rounded-lg border transition ${
                      formData.splitType === "custom"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium text-sm">Custom Split</div>
                    <div className="text-xs mt-1 opacity-75">Specify amount per person</div>
                  </button>
                </div>

                {formData.splitType === "equal" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">Select people to split with:</p>
                    {participants.map((participant) => (
                      <label
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.splitWith.includes(participant.id)}
                          onChange={() => toggleSplitWith(participant.id)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm font-medium text-foreground">{participant.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-2">Specify amount for each person:</p>
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground flex-1">{participant.name}</span>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.customSplits[participant.id] || ""}
                            onChange={(e) => handleCustomSplitChange(participant.id, e.target.value)}
                            className="w-full pl-6 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Link href={`/expenses?tripId=${tripId}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
