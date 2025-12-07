import { NextRequest, NextResponse } from "next/server"
import { getMPs } from "@/lib/services/process-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const { data, count } = await getMPs({
      club: searchParams.get("club") || undefined,
      active: searchParams.get("active") === "true" ? true : searchParams.get("active") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      limit: Number.parseInt(searchParams.get("limit") || "100"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
    })

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error("[API/mps] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
