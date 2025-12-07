"use client"

import { TrendingUp, Clock, CheckCircle, XCircle, FileText, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardsProps {
  stats: {
    total: number
    inProgress: number
    completed: number
    rejected: number
    avgDuration: number
    watching: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Wszystkich procesów",
      value: stats.total,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "W trakcie",
      value: stats.inProgress,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Zakończonych",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Odrzuconych",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Śr. czas (dni)",
      value: stats.avgDuration,
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Obserwujesz",
      value: stats.watching,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
