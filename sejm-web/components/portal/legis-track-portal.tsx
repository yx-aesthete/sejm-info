"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Header } from "./header"
import { NavTabs, type NavTab } from "./nav-tabs"
import { LawCard } from "./law-card"
import { Filters } from "./filters"
import { StatsCards } from "./stats-cards"
import { type LegislativeFilter, type ExtendedLegislativeProcess } from "@/lib/legislative-extended-schema"
import { Loader2 } from "lucide-react"

const PAGE_SIZE = 20

export function LegisTrackPortal() {
  const [activeTab, setActiveTab] = useState<NavTab>("galeria")
  const [filters, setFilters] = useState<LegislativeFilter>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  
  // Processes state with pagination
  const [processes, setProcesses] = useState<ExtendedLegislativeProcess[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  
  // Stats state (separate from processes)
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    avgDuration: 0,
    watching: 0,
  })

  // Ref for infinite scroll
  const loaderRef = useRef<HTMLDivElement>(null)

  // Fetch stats separately with filters (lightweight call)
  useEffect(() => {
    async function fetchStats() {
      try {
        const params = new URLSearchParams()

        if (searchQuery) params.set("search", searchQuery)
        if (filters.status?.length) {
          const status = filters.status[0]
          if (status === "in-progress") params.set("status", "active")
          else if (status === "completed") params.set("status", "finished")
          else if (status === "rejected") params.set("status", "rejected")
        }
        if (filters.initiators?.length) {
          params.set("projectType", filters.initiators[0])
        }

        const queryString = params.toString()
        const url = queryString ? `/api/processes/stats?${queryString}` : "/api/processes/stats"

        const res = await fetch(url)
        const json = await res.json()
        if (json.data) {
          setStats({
            total: json.data.totalProcesses || 0,
            inProgress: json.data.activeProcesses || 0,
            completed: json.data.finishedProcesses || 0,
            rejected: json.data.rejectedProcesses || 0,
            avgDuration: json.data.avgDuration || 0,
            watching: watchedIds.size,
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [searchQuery, filters.status, filters.initiators, watchedIds.size])

  // Build query params
  const buildQueryParams = useCallback((currentOffset: number) => {
    const params = new URLSearchParams()
    params.set("limit", String(PAGE_SIZE))
    params.set("offset", String(currentOffset))
    
    if (searchQuery) params.set("search", searchQuery)
    if (filters.status?.length) {
      const status = filters.status[0]
      if (status === "in-progress") params.set("status", "active")
      else if (status === "completed") params.set("status", "finished")
      else if (status === "rejected") params.set("status", "rejected")
    }
    if (filters.initiators?.length) {
      params.set("projectType", filters.initiators[0])
    }
    
    return params.toString()
  }, [searchQuery, filters])

  // Fetch initial processes
  const fetchProcesses = useCallback(async (reset = true) => {
    const newOffset = reset ? 0 : offset
    
    if (reset) {
      setIsLoading(true)
      setProcesses([])
      setOffset(0)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const queryString = buildQueryParams(newOffset)
      const res = await fetch(`/api/processes?${queryString}`)
      const json = await res.json()
      
      const newData = json.data || []
      const count = json.count || 0
      
      if (reset) {
        setProcesses(newData)
      } else {
        setProcesses(prev => [...prev, ...newData])
      }
      
      setTotalCount(count)
      setHasMore(newOffset + newData.length < count)
      setOffset(newOffset + newData.length)
    } catch (error) {
      console.error("Failed to fetch processes:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [buildQueryParams, offset])

  // Initial load and filter changes
  useEffect(() => {
    fetchProcesses(true)
  }, [searchQuery, filters])

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchProcesses(false)
    }
  }, [fetchProcesses, isLoadingMore, hasMore])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoading, isLoadingMore])

  // Filter processes locally for categories/urgency (not yet in API)
  const filteredProcesses = useMemo(() => {
    let results = [...processes]

    // Category filter (client-side)
    if (filters.categories?.length) {
      results = results.filter((p) => p.categories?.some((c) => filters.categories?.includes(c)))
    }

    // Urgency filter (client-side)
    if (filters.urgency?.length) {
      results = results.filter((p) => filters.urgency?.includes(p.urgency))
    }

    // Watched filter (for "obserwowane" tab)
    if (activeTab === "obserwowane") {
      results = results.filter((p) => watchedIds.has(p.id))
    }

    return results
  }, [processes, filters.categories, filters.urgency, activeTab, watchedIds])

  const handleWatch = (id: string) => {
    setWatchedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onSearch={setSearchQuery} alertCount={3} watchedCount={watchedIds.size} />
      <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Stats - fetched separately */}
          <div className="mb-6">
            <StatsCards stats={{ ...stats, watching: watchedIds.size }} />
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <Filters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {activeTab === "obserwowane" ? "Obserwowane ustawy" : "Procesy legislacyjne"}
              <span className="ml-2 text-muted-foreground font-normal text-base">
                ({filteredProcesses.length}{totalCount > processes.length ? ` z ${totalCount}` : ""})
              </span>
            </h2>
          </div>

          {/* Results grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProcesses.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProcesses.map((process) => (
                  <LawCard
                    key={process.id}
                    process={process}
                    isWatched={watchedIds.has(process.id)}
                    onWatch={handleWatch}
                  />
                ))}
              </div>
              
              {/* Infinite scroll loader */}
              <div ref={loaderRef} className="flex justify-center py-8">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
                {!hasMore && processes.length > 0 && (
                  <p className="text-sm text-muted-foreground">Załadowano wszystkie procesy</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Brak wyników dla podanych kryteriów</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>sejm.info - Monitor procesu legislacyjnego w Polsce</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">
                O projekcie
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                API
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
