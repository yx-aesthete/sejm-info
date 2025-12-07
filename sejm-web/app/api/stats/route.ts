import { NextResponse } from "next/server"
import { getStats } from "@/lib/services/process-service"

export async function GET() {
  try {
    const data = await getStats()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API/stats] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
