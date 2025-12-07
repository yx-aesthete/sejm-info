import { NextRequest, NextResponse } from "next/server"
import { getVotings } from "@/lib/services/process-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const { data, count } = await getVotings({
      processId: searchParams.get("processId") || undefined,
      sittingNumber: searchParams.get("sitting") ? Number.parseInt(searchParams.get("sitting")!) : undefined,
      limit: Number.parseInt(searchParams.get("limit") || "50"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
    })

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error("[API/votings] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
