"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
  ChevronRight,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Bookmark,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  type LegislativeCategory,
  type Urgency,
  type LegislativeFilter,
  type ExtendedLegislativeProcess,
} from "@/lib/legislative-extended-schema"
import { INITIATOR_COLORS, type InitiatorType } from "@/lib/legislative-schema"
import { useDebounce } from "@/hooks/use-debounce"

export const INITIATOR_LABELS: Record<InitiatorType, string> = {
  president: "Prezydent",
  government: "Rząd",
  deputies: "Posłowie",
  senate: "Senat",
  citizens: "Obywatele",
}

interface DrukSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentDrukNr?: string
}

export function DrukSidebar({ isOpen, onClose, currentDrukNr }: DrukSidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<LegislativeFilter>({})
  const [showFilters, setShowFilters] = useState(false)
  const [processes, setProcesses] = useState<ExtendedLegislativeProcess[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    async function fetchProcesses() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (filters.status && filters.status.length > 0) params.set("status", filters.status[0]) // Uproszczenie: API obsługuje jeden status na razie, można rozbudować
        if (filters.initiators && filters.initiators.length > 0) params.set("projectType", filters.initiators[0]) // To samo dla typu

        // Fetch
        const res = await fetch(`/api/processes?${params.toString()}`)
        const json = await res.json()
        setProcesses(json.data || [])
      } catch (error) {
        console.error("Failed to fetch processes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchProcesses()
    }
  }, [isOpen, debouncedSearch, filters])

  const activeFiltersCount = [
    filters.categories?.length,
    filters.initiators?.length,
    filters.status?.length,
    filters.urgency?.length,
  ]
    .filter(Boolean)
    .reduce((a, b) => (a || 0) + (b || 0), 0)

  const toggleCategory = (cat: LegislativeCategory) => {
    const current = filters.categories || []
    const updated = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat]
    setFilters({ ...filters, categories: updated.length ? updated : undefined })
  }

  const toggleInitiator = (init: InitiatorType) => {
    const current = filters.initiators || []
    const updated = current.includes(init) ? current.filter((i) => i !== init) : [...current, init]
    setFilters({ ...filters, initiators: updated.length ? updated : undefined })
  }

  const toggleStatus = (status: "in-progress" | "completed" | "rejected") => {
    const current = filters.status || []
    const updated = current.includes(status) ? current.filter((s) => s !== status) : [...current, status]
    setFilters({ ...filters, status: updated.length ? updated : undefined })
  }

  const toggleUrgency = (urgency: Urgency) => {
    const current = filters.urgency || []
    const updated = current.includes(urgency) ? current.filter((u) => u !== urgency) : [...current, urgency]
    setFilters({ ...filters, urgency: updated.length ? updated : undefined })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      case "rejected":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />
      default:
        return <Clock className="h-3.5 w-3.5 text-blue-500" />
    }
  }

  const getDrukNrFromDocument = (documentNumber: string) => {
    // "Druk nr 764" -> "764"
    const match = documentNumber.match(/(\d+)/)
    return match ? match[1] : documentNumber
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-card border-r border-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Przeglądaj druki</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj druku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Filters toggle */}
          <div className="p-3 border-b border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtry
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-3 space-y-2">
                {/* Kategorie */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 bg-transparent">
                      <span>Kategoria</span>
                      {filters.categories?.length ? (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {filters.categories.length}
                        </Badge>
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Kategorie tematyczne</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(CATEGORY_CONFIG) as LegislativeCategory[]).map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={filters.categories?.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      >
                        <span className="mr-2">{CATEGORY_CONFIG[cat].icon}</span>
                        {CATEGORY_CONFIG[cat].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Inicjator */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 bg-transparent">
                      <span>Inicjator</span>
                      {filters.initiators?.length ? (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {filters.initiators.length}
                        </Badge>
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
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
                        <span
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: INITIATOR_COLORS[init] }}
                        />
                        {INITIATOR_LABELS[init]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 bg-transparent">
                      <span>Status</span>
                      {filters.status?.length ? (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {filters.status.length}
                        </Badge>
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuCheckboxItem
                      checked={filters.status?.includes("in-progress")}
                      onCheckedChange={() => toggleStatus("in-progress")}
                    >
                      <Clock className="mr-2 h-3.5 w-3.5 text-blue-500" />W trakcie
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.status?.includes("completed")}
                      onCheckedChange={() => toggleStatus("completed")}
                    >
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-500" />
                      Zakończone
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.status?.includes("rejected")}
                      onCheckedChange={() => toggleStatus("rejected")}
                    >
                      <XCircle className="mr-2 h-3.5 w-3.5 text-red-500" />
                      Odrzucone
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Pilność */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 bg-transparent">
                      <span>Pilność</span>
                      {filters.urgency?.length ? (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {filters.urgency.length}
                        </Badge>
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
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
                          className="mr-2 h-2 w-2 rounded-full"
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
                    className="w-full text-destructive hover:text-destructive"
                    onClick={clearFilters}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Wyczyść filtry ({activeFiltersCount})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border shrink-0">
            Znaleziono: {processes.length} druk{processes.length === 1 ? "" : "ów"}
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {processes.map((process) => {
                    const drukNr = getDrukNrFromDocument(process.documentNumber)
                    const isActive = currentDrukNr === drukNr
                    const initiatorColor = INITIATOR_COLORS[process.initiator] || "#6b7280"

                    return (
                      <Link
                        key={process.id}
                        href={`/druk/${drukNr}`}
                        onClick={onClose}
                        className={`block p-3 rounded-lg border transition-all hover:bg-muted ${
                          isActive ? "bg-primary/10 border-primary" : "border-transparent hover:border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">{getStatusIcon(process.processStatus)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">{process.documentNumber}</span>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: initiatorColor }} />
                            </div>
                            <h3 className="text-sm font-medium leading-snug line-clamp-2">
                              {process.shortTitle || process.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              {process.categories?.slice(0, 2).map((cat) => (
                                <span
                                  key={cat}
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${CATEGORY_CONFIG[cat]?.color}20`,
                                    color: CATEGORY_CONFIG[cat]?.color,
                                  }}
                                >
                                  {CATEGORY_CONFIG[cat]?.icon} {CATEGORY_CONFIG[cat]?.label}
                                </span>
                              ))}
                            </div>
                            {process.urgency !== "normal" && (
                              <Badge
                                variant="outline"
                                className="mt-2 text-[10px] h-5"
                                style={{
                                  borderColor: URGENCY_CONFIG[process.urgency].color,
                                  color: URGENCY_CONFIG[process.urgency].color,
                                }}
                              >
                                {URGENCY_CONFIG[process.urgency].label}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    )
                  })}

                  {processes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nie znaleziono druków</p>
                      <p className="text-xs mt-1">Spróbuj zmienić kryteria wyszukiwania</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-border shrink-0">
            <Link href="/" onClick={onClose}>
              <Button variant="outline" className="w-full bg-transparent">
                <Bookmark className="h-4 w-4 mr-2" />
                Przeglądaj galerię ustaw
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
