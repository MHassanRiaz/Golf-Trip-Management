import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlayersLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="w-32 h-8 mb-2" />
                <Skeleton className="w-48 h-4" />
              </div>
            </div>
            <Skeleton className="w-32 h-10" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="w-40 h-5" />
                        <Skeleton className="w-56 h-4" />
                      </div>
                    </div>
                    <Skeleton className="w-48 h-4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
