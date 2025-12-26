"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, Trophy, CheckCircle, Target, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">GolfTrip</h1>
              <p className="text-xs text-muted-foreground">Premium Trip Management</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                Get Started
              </Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-border/60 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Target className="w-4 h-4" />
                Professional Golf Trip Management
              </div>
              <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                Elevate Your{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent">
                  Golf Experience
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Organize unforgettable golf outings with sophisticated scoring, live standings, seamless expense
                tracking, and intelligent team management.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all text-base px-8"
                >
                  Create a Trip
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-border/60 hover:bg-muted/50 text-base px-8 bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Card className="border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 shadow-sm">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Auto-generate balanced teams and perfect foursomes
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 shadow-sm">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-semibold">Live Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time match scoring with handicap calculations
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 shadow-sm">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dynamic leaderboards and performance tracking
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 shadow-sm">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-semibold">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Smart expense splitting and instant settlements
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border/60">
        <div className="text-center mb-16">
          <h3 className="text-4xl lg:text-5xl font-bold text-foreground mb-5 tracking-tight">Everything You Need</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Complete golf trip management from setup to settlement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Trip Creation",
              desc: "Set up trips with participants, handicaps, and custom formats",
              icon: CheckCircle,
            },
            {
              title: "Round Management",
              desc: "Define rounds, courses, and generate balanced foursomes",
              icon: Target,
            },
            {
              title: "Match Scoring",
              desc: "Track gross, net, and drinking-adjusted scores hole-by-hole",
              icon: TrendingUp,
            },
            {
              title: "Team Standings",
              desc: "Real-time leaderboards with comprehensive performance metrics",
              icon: BarChart3,
            },
            {
              title: "Expense Tracking",
              desc: "Split costs equally or with custom calculations per person",
              icon: DollarSign,
            },
            {
              title: "Easy Settlement",
              desc: "Automatically calculate who owes whom with smart algorithms",
              icon: CheckCircle,
            },
          ].map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card
                key={idx}
                className="border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card to-card/50"
              >
                <CardHeader>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 shadow-sm">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border/60">
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/20 rounded-3xl p-12 lg:p-16 text-center overflow-hidden shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative z-10">
            <h3 className="text-4xl lg:text-5xl font-bold text-foreground mb-5 tracking-tight">
              Ready to Organize Your Next Golf Trip?
            </h3>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join players who are already using GolfTrip to manage their outings with elegance and precision.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all text-base px-10 py-6"
              >
                Start Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-muted/30 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-muted-foreground text-sm">
          <p className="mb-2">&copy; 2025 GolfTrip. All rights reserved.</p>
          <p className="text-xs">Built with precision for golf enthusiasts</p>
        </div>
      </footer>
    </div>
  )
}
