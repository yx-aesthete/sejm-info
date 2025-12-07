import { NextRequest, NextResponse } from "next/server"
import { getProcessStats } from "@/lib/services/process-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const data = await getProcessStats({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") as any,
      projectType: searchParams.get("projectType") || undefined,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API/processes/stats] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
