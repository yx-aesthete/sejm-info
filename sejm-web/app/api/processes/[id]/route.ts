import { NextRequest, NextResponse } from "next/server"
import { getProcessById } from "@/lib/services/process-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getProcessById(id)

    if (!data) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API/processes/[id]] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
