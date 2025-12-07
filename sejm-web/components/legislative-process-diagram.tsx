"use client"

import { useState } from "react"
import { Legend } from "./legend"
import { ProcessTimeline } from "./process-timeline"
import { StageDetails } from "./stage-details"
import { CanvasTimeline } from "./canvas-timeline"
import { legislativeStages, type LegislativeStage } from "@/lib/legislative-data"

export function LegislativeProcessDiagram() {
  const [selectedStage, setSelectedStage] = useState<LegislativeStage | null>(null)
  const [selectedInitiator, setSelectedInitiator] = useState<string>("government")
  const [viewMode, setViewMode] = useState<"symbols" | "canvas">("canvas")

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setViewMode("symbols")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === "symbols"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Widok symboliczny
        </button>
        <button
          onClick={() => setViewMode("canvas")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === "canvas"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Oś czasu (Canvas)
        </button>
      </div>

      {viewMode === "symbols" ? (
        <>
          <Legend selectedInitiator={selectedInitiator} onInitiatorChange={setSelectedInitiator} />

          <div className="bg-card rounded-xl border border-border p-6 overflow-x-auto">
            <ProcessTimeline
              stages={legislativeStages}
              initiator={selectedInitiator}
              onStageSelect={setSelectedStage}
              selectedStage={selectedStage}
            />
          </div>

          {selectedStage && (
            <StageDetails stage={selectedStage} initiator={selectedInitiator} onClose={() => setSelectedStage(null)} />
          )}

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Pełna mapa symboli</h3>
            <SymbolsReference />
          </div>
        </>
      ) : (
        <CanvasTimeline />
      )}
    </div>
  )
}

function SymbolsReference() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium mb-3 text-foreground">Warstwa 1: Kształty (typ etapu)</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground" />
            <span>Okrąg — Start/koniec (inicjatywa, publikacja, odrzucenie)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 rounded-md border-2 border-muted-foreground" />
            <span>Zaokrąglony prostokąt — Prace/analiza (komisje)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 border-[3px] border-muted-foreground" />
            <span>Prostokąt — Czytania w Sejmie</span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 100 100">
              <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="currentColor" strokeWidth="0" />
              <circle cx="50" cy="5" r="6" fill="currentColor" className="text-muted-foreground" />
              <circle cx="95" cy="50" r="6" fill="currentColor" className="text-muted-foreground" />
              <circle cx="50" cy="95" r="6" fill="currentColor" className="text-muted-foreground" />
              <circle cx="5" cy="50" r="6" fill="currentColor" className="text-muted-foreground" />
              <line
                x1="50"
                y1="5"
                x2="95"
                y2="50"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted-foreground"
              />
              <line
                x1="95"
                y1="50"
                x2="50"
                y2="95"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted-foreground"
              />
              <line
                x1="50"
                y1="95"
                x2="5"
                y2="50"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted-foreground"
              />
              <line
                x1="5"
                y1="50"
                x2="50"
                y2="5"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted-foreground"
              />
            </svg>
            <span>Romb (z punktami w rogach) — Decyzja/głosowanie</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
            </div>
            <span>Podwójny okrąg — Zakończenie pozytywne</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center text-muted-foreground font-bold">
              ✕
            </div>
            <span>Okrąg z X — Odrzucenie</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3 text-foreground">Warstwa 2: Kolory (inicjator)</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500" />
            <span>Czerwony — Prezydent RP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-800" />
            <span>Granatowy — Rada Ministrów (rząd)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500" />
            <span>Pomarańczowy — Poselski</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600" />
            <span>Fioletowy — Senat</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600" />
            <span>Zielony — Obywatelska</span>
          </div>
        </div>

        <h4 className="font-medium mb-3 mt-6 text-foreground">Statusy etapów</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Pełna jasność = zakończony</p>
          <p>• Czerwona obwódka = obecny etap</p>
          <p>• Przygaszony = przyszły</p>
          <p>• Bardzo przygaszony = alternatywa</p>
        </div>
      </div>
    </div>
  )
}
