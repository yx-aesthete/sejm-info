"use client"

import { useRef, useEffect, useState } from "react"
import type { ParliamentComposition, VotingResult, VotingEstimation } from "@/lib/parliament-data"

interface ParliamentHemicycleProps {
  composition: ParliamentComposition
  votingResult?: VotingResult
  estimation?: VotingEstimation
}

export function ParliamentHemicycle({ composition, votingResult, estimation }: ParliamentHemicycleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 160 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        const height = Math.max(100, width * 0.5) // proporcje 2:1
        setDimensions({ width, height })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = dimensions

    // High DPI support
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Clear
    ctx.clearRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height - 5

    const minDim = Math.min(width, height)
    const innerRadius = minDim * 0.2
    const outerRadius = minDim * 0.9

    const rows = composition.chamber === "sejm" ? 8 : 5
    const seatRadius = Math.max(2, Math.min(6, minDim / 40))

    // Generuj pozycje siedzeń
    const seats: { x: number; y: number; partyId: string; color: string; seatIndex: number }[] = []
    let totalSeatsPlaced = 0

    // Przypisz siedzenia do partii
    const partySeats: { partyId: string; color: string; count: number }[] = composition.parties.map((p) => ({
      partyId: p.id,
      color: p.color,
      count: p.seats,
    }))

    const seatsPerRow: number[] = []
    const rowRadii: number[] = []

    for (let row = 0; row < rows; row++) {
      const rowRadius = innerRadius + ((outerRadius - innerRadius) * (row + 0.5)) / rows
      rowRadii.push(rowRadius)
      const spacing = seatRadius * 2.8
      const rowSeats = Math.floor((Math.PI * rowRadius) / spacing)
      seatsPerRow.push(rowSeats)
    }

    const totalCapacity = seatsPerRow.reduce((a, b) => a + b, 0)
    const scaleFactor = composition.totalSeats / totalCapacity

    // Generuj rzędy półkola
    for (let row = 0; row < rows && totalSeatsPlaced < composition.totalSeats; row++) {
      const rowRadius = rowRadii[row]
      const rowSeats = Math.min(Math.round(seatsPerRow[row] * scaleFactor), composition.totalSeats - totalSeatsPlaced)

      for (let s = 0; s < rowSeats && totalSeatsPlaced < composition.totalSeats; s++) {
        const angle = Math.PI - (Math.PI * (s + 0.5)) / rowSeats
        const x = centerX + rowRadius * Math.cos(angle)
        const y = centerY - rowRadius * Math.sin(angle)

        // Znajdź partię dla tego siedzenia
        let partyIndex = 0
        let seatsCount = 0
        for (let i = 0; i < partySeats.length; i++) {
          seatsCount += partySeats[i].count
          if (totalSeatsPlaced < seatsCount) {
            partyIndex = i
            break
          }
        }

        seats.push({
          x,
          y,
          partyId: partySeats[partyIndex].partyId,
          color: partySeats[partyIndex].color,
          seatIndex: totalSeatsPlaced,
        })
        totalSeatsPlaced++
      }
    }

    // Rysuj siedzenia
    seats.forEach((seat) => {
      ctx.beginPath()
      ctx.arc(seat.x, seat.y, seatRadius, 0, Math.PI * 2)

      // Kolor w zależności od trybu
      if (votingResult?.byParty) {
        const partyVote = votingResult.byParty[seat.partyId]
        if (partyVote) {
          const totalPartyVotes = partyVote.for + partyVote.against + partyVote.abstained
          const forRatio = partyVote.for / totalPartyVotes
          const againstRatio = partyVote.against / totalPartyVotes
          const rand = Math.random()
          if (rand < forRatio) {
            ctx.fillStyle = "#22c55e"
          } else if (rand < forRatio + againstRatio) {
            ctx.fillStyle = "#ef4444"
          } else {
            ctx.fillStyle = "#9ca3af"
          }
        } else {
          ctx.fillStyle = seat.color
        }
      } else if (estimation) {
        if (
          estimation.supportingParties.some(
            (p) => composition.parties.find((cp) => cp.shortName === p)?.id === seat.partyId,
          )
        ) {
          ctx.fillStyle = "#22c55e80"
        } else {
          ctx.fillStyle = "#ef444480"
        }
      } else {
        ctx.fillStyle = seat.color
      }

      ctx.fill()
    })

    // Rysuj linię większości
    const majorityAngle = Math.PI * (1 - composition.majority / composition.totalSeats)
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + outerRadius * Math.cos(majorityAngle), centerY - outerRadius * Math.sin(majorityAngle))
    ctx.strokeStyle = "#f59e0b"
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])
  }, [composition, votingResult, estimation, dimensions])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} />

      {/* Legenda partii - kompaktowa */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {composition.parties.slice(0, 6).map((party) => (
          <div key={party.id} className="flex items-center gap-1 text-[10px]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: party.color }} />
            <span className="text-muted-foreground">{party.shortName}</span>
          </div>
        ))}
      </div>

      {/* Podsumowanie głosowania */}
      {votingResult && (
        <div className="flex justify-center gap-3 mt-2 text-xs">
          <span className="text-green-600 font-medium">Za: {votingResult.for}</span>
          <span className="text-red-600 font-medium">Przeciw: {votingResult.against}</span>
          <span className="text-gray-500">Wstrz.: {votingResult.abstained}</span>
        </div>
      )}

      {/* Estymacja */}
      {estimation && !votingResult && (
        <div className="mt-2 text-center">
          <div className="text-[10px] text-muted-foreground">Estymacja ({estimation.confidence}%)</div>
          <div className="flex justify-center gap-3 text-xs">
            <span className="text-green-600 font-medium">~{estimation.estimatedFor}</span>
            <span className="text-red-600 font-medium">~{estimation.estimatedAgainst}</span>
          </div>
        </div>
      )}
    </div>
  )
}
