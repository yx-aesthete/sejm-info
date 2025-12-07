import { NextRequest, NextResponse } from "next/server"
import { getProcesses } from "@/lib/services/process-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const { data, count } = await getProcesses({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") as any,
      projectType: searchParams.get("projectType") || undefined,
      limit: Number.parseInt(searchParams.get("limit") || "50"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
    })

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error("[API/processes] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
