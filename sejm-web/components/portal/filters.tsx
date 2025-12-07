"use client"
import { Filter, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type LegislativeFilter,
  type LegislativeCategory,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  type Urgency,
} from "@/lib/legislative-extended-schema"
import type { InitiatorType } from "@/lib/legislative-schema"

const INITIATOR_LABELS: Record<InitiatorType, string> = {
  president: "Prezydent",
  government: "Rząd",
  deputies: "Posłowie",
  senate: "Senat",
  citizens: "Obywatele",
}

interface FiltersProps {
  filters: LegislativeFilter
  onFiltersChange: (filters: LegislativeFilter) => void
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const activeFiltersCount = [
    filters.categories?.length,
    filters.initiators?.length,
    filters.status?.length,
    filters.urgency?.length,
  ]
    .filter(Boolean)
    .reduce((a, b) => (a || 0) + (b || 0), 0)

  const clearFilters = () => {
    onFiltersChange({})
  }

  const toggleCategory = (cat: LegislativeCategory) => {
    const current = filters.categories || []
    const updated = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat]
    onFiltersChange({ ...filters, categories: updated.length ? updated : undefined })
  }

  const toggleInitiator = (init: InitiatorType) => {
    const current = filters.initiators || []
    const updated = current.includes(init) ? current.filter((i) => i !== init) : [...current, init]
    onFiltersChange({ ...filters, initiators: updated.length ? updated : undefined })
  }

  const toggleStatus = (status: "in-progress" | "completed" | "rejected") => {
    const current = filters.status || []
    const updated = current.includes(status) ? current.filter((s) => s !== status) : [...current, status]
    onFiltersChange({ ...filters, status: updated.length ? updated : undefined })
  }

  const toggleUrgency = (urgency: Urgency) => {
    const current = filters.urgency || []
    const updated = current.includes(urgency) ? current.filter((u) => u !== urgency) : [...current, urgency]
    onFiltersChange({ ...filters, urgency: updated.length ? updated : undefined })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
        <Filter className="h-4 w-4" />
        Filtry
      </div>

      {/* Kategorie */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            Kategoria
            {filters.categories?.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.categories.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Kategorie tematyczne</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(CATEGORY_CONFIG) as LegislativeCategory[]).map((cat) => {
            const IconComponent = CATEGORY_CONFIG[cat].icon
            return (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={filters.categories?.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              >
                <IconComponent className="mr-2 h-4 w-4" style={{ color: CATEGORY_CONFIG[cat].color }} />
                {CATEGORY_CONFIG[cat].label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Inicjator */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            Inicjator
            {filters.initiators?.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.initiators.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Kto złożył projekt</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(INITIATOR_LABELS) as InitiatorType[]).map((init) => (
            <DropdownMenuCheckboxItem
              key={init}
              checked={filters.initiators?.includes(init)}
              onCheckedChange={() => toggleInitiator(init)}
            >
              {INITIATOR_LABELS[init]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            Status
            {filters.status?.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.status.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={filters.status?.includes("in-progress")}
            onCheckedChange={() => toggleStatus("in-progress")}
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-blue-500 inline-block" />W trakcie
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status?.includes("completed")}
            onCheckedChange={() => toggleStatus("completed")}
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 inline-block" />
            Zakończone
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status?.includes("rejected")}
            onCheckedChange={() => toggleStatus("rejected")}
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-red-500 inline-block" />
            Odrzucone
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pilność */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 bg-transparent">
            Pilność
            {filters.urgency?.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.urgency.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urg) => (
            <DropdownMenuCheckboxItem
              key={urg}
              checked={filters.urgency?.includes(urg)}
              onCheckedChange={() => toggleUrgency(urg)}
            >
              <span
                className="mr-2 h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: URGENCY_CONFIG[urg].color }}
              />
              {URGENCY_CONFIG[urg].label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-destructive hover:text-destructive"
          onClick={clearFilters}
        >
          <X className="mr-1 h-3 w-3" />
          Wyczyść ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}
