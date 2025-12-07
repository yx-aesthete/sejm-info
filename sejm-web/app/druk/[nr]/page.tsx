import { notFound } from "next/navigation"
import { getProcessById } from "@/lib/services/process-service"
import { DrukPageClient } from "./druk-client"

export async function generateMetadata({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params
  const process = await getProcessById(nr)

  if (!process) {
    return { title: "Nie znaleziono druku | sejm.info" }
  }

  return {
    title: `${process.shortTitle || process.title} | ${process.documentNumber} | sejm.info`,
    description: process.simpleSummary,
  }
}

export default async function DrukPage({ params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params
  const process = await getProcessById(nr)

  if (!process) {
    notFound()
  }

  return <DrukPageClient process={process} drukNr={nr} />
}
