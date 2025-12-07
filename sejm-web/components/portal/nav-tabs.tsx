"use client"

import { cn } from "@/lib/utils"

export type NavTab = "galeria" | "obserwowane" | "analityka" | "glosowania" | "konsultacje"

interface NavTabsProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

const tabs: { id: NavTab; label: string; description: string }[] = [
  { id: "galeria", label: "Galeria ustaw", description: "Wszystkie procesy legislacyjne" },
  { id: "obserwowane", label: "Obserwowane", description: "Twoje zakładki" },
  { id: "analityka", label: "Analityka", description: "Statystyki i wskaźniki" },
  { id: "glosowania", label: "Głosowania", description: "Wyniki głosowań" },
  { id: "konsultacje", label: "Konsultacje", description: "Konsultacje społeczne" },
]

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
