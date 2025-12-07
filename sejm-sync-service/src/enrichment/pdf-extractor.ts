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
  prints: Array<{ number: string; attachments?: any[] }>,
  processNumber: string,
  term: number = 10
): Promise<PrintContent | null> {
  // Znajdź druk dla tego procesu
  const print = prints.find(p => p.number === processNumber)

  if (!print || !print.attachments || print.attachments.length === 0) {
    console.log(`[PDF] No attachments for print ${processNumber}`)
    return null
  }

  // Find PDF filename
  // Attachments can be strings (filenames) or objects { name: string }
  let pdfFilename: string | undefined

  for (const att of print.attachments) {
    const name = typeof att === "string" ? att : att.name
    if (name && name.toLowerCase().endsWith(".pdf")) {
      pdfFilename = name
      break
    }
  }

  if (!pdfFilename) {
    console.log(`[PDF] No PDF attachment for print ${processNumber}`)
    return null
  }

  // Construct URL based on Sejm API pattern
  // Format: https://api.sejm.gov.pl/sejm/term{term}/prints/{printNumber}/{fileName}
  const url = `https://api.sejm.gov.pl/sejm/term${term}/prints/${processNumber}/${pdfFilename}`

  return await extractPrintPDF(url)
}
