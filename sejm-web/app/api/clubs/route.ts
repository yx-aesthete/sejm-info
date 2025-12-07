import { NextResponse } from "next/server"
import { getClubs } from "@/lib/services/process-service"

export async function GET() {
  try {
    const data = await getClubs()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API/clubs] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
