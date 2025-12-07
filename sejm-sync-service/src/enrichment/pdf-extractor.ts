import pdf from "pdf-parse"

export interface PrintContent {
  text: string
  pages: number
  truncated: boolean
}

/**
 * Pobiera i parsuje PDF druku sejmowego
 * Limit: pierwsze 10 stron lub 50,000 znaków (dla optymalizacji kosztów AI)
 */
export async function extractPrintPDF(pdfUrl: string): Promise<PrintContent | null> {
  try {
    console.log(`[PDF] Fetching: ${pdfUrl}`)

    const response = await fetch(pdfUrl)
    if (!response.ok) {
      console.warn(`[PDF] HTTP ${response.status} for ${pdfUrl}`)
      return null
    }

    const buffer = await response.arrayBuffer()
    const data = await pdf(Buffer.from(buffer))

    // Limit tekstu do ~50k znaków (oszczędność tokenów)
    const MAX_CHARS = 50000
    let text = data.text
    let truncated = false

    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS)
      truncated = true
      console.log(`[PDF] Truncated from ${data.text.length} to ${MAX_CHARS} chars`)
    }

    // Usuń nadmiarowe białe znaki
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    return {
      text,
      pages: data.numpages,
      truncated
    }
  } catch (error) {
    console.error(`[PDF] Error extracting ${pdfUrl}:`, error)
    return null
  }
}

/**
 * Pobiera główny druk procesu (najczęściej pierwszy z listy attachments)
 */
export async function getProcessPrintContent(
  prints: Array<{ number: string; attachments?: Array<{ name: string; URL: string }> }>,
  processNumber: string
): Promise<PrintContent | null> {
  // Znajdź druk dla tego procesu
  const print = prints.find(p => p.number === processNumber)

  if (!print || !print.attachments || print.attachments.length === 0) {
    console.log(`[PDF] No attachments for print ${processNumber}`)
    return null
  }

  // Pobierz pierwszy PDF (zazwyczaj główny dokument)
  const mainAttachment = print.attachments.find(a => a?.name?.toLowerCase().includes(".pdf"))

  if (!mainAttachment) {
    console.log(`[PDF] No PDF attachment for print ${processNumber}`)
    return null
  }

  return await extractPrintPDF(mainAttachment.URL)
}
