const SEJM_API_BASE = "https://api.sejm.gov.pl/sejm"
const CURRENT_TERM = 10

// Typy z API Sejmu
export interface SejmMP {
  id: number
  firstName: string
  secondName?: string
  lastName: string
  email?: string
  club: string
  active: boolean
  birthDate?: string
  birthLocation?: string
  profession?: string
  educationLevel?: string
  districtName?: string
  districtNum?: number
  voivodeship?: string
  numberOfVotes?: number
}

export interface SejmClub {
  id: string
  name: string
  membersCount: number
  phone?: string
  fax?: string
  email?: string
}

export interface SejmPrint {
  number: string
  term: number
  title: string
  documentDate?: string
  deliveryDate?: string
  documentType?: string
  changeDate?: string
  processPrint?: string
  additionalPrints?: string[]
  attachments?: Array<{
    name: string
    lastModified: string
    URL: string
  }>
}

export interface SejmProcess {
  number: string
  term: number
  title: string
  description?: string
  documentType?: string
  UE?: boolean
  principleOfSubsidiarity?: string
  documentDate?: string
  changeDate?: string
  webGeneratedDate?: string
  rclNum?: string
  stages?: SejmProcessStage[]
}

export interface SejmProcessStage {
  stageName: string
  stageNumber?: number
  date?: string
  childStages?: SejmProcessStage[]
  sittingNum?: number
  votingNum?: number[]
  committees?: string[]
  comment?: string
  decision?: string
}

export interface SejmVoting {
  term: number
  sitting: number
  sittingDay: number
  votingNumber: number
  date: string
  topic: string
  description?: string
  kind: "ON_LIST" | "ELECTRONIC"
  yes: number
  no: number
  abstain: number
  notParticipating: number
  totalVoted?: number
  plesarno?: number
}

export interface SejmVotingDetails extends SejmVoting {
  votes: Array<{
    MP: number
    vote: "YES" | "NO" | "ABSTAIN" | "ABSENT" | "VOTE_VALID"
    firstName?: string
    lastName?: string
    club?: string
  }>
}

export interface SejmSitting {
  number: number
  title?: string
  dates: string[]
}

export interface SejmCommittee {
  code: string
  name: string
  nameGenitive?: string
  type?: string
  phone?: string
  compositionDate?: string
  scope?: string
}

// Funkcje pobierania danych
export async function fetchWithRetry<T>(url: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 }, // No cache for fresh data
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[SejmAPI] Attempt ${i + 1} failed for ${url}:`, error)
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))) // Exponential backoff
    }
  }
  return null
}

// Posłowie
export async function fetchAllMPs(term = CURRENT_TERM): Promise<SejmMP[]> {
  const data = await fetchWithRetry<SejmMP[]>(`${SEJM_API_BASE}/term${term}/MP`)
  return data || []
}

export async function fetchMP(id: number, term = CURRENT_TERM): Promise<SejmMP | null> {
  return fetchWithRetry<SejmMP>(`${SEJM_API_BASE}/term${term}/MP/${id}`)
}

// Kluby
export async function fetchAllClubs(term = CURRENT_TERM): Promise<SejmClub[]> {
  const data = await fetchWithRetry<SejmClub[]>(`${SEJM_API_BASE}/term${term}/clubs`)
  return data || []
}

export async function fetchClub(id: string, term = CURRENT_TERM): Promise<SejmClub | null> {
  return fetchWithRetry<SejmClub>(`${SEJM_API_BASE}/term${term}/clubs/${id}`)
}

// Druki
export async function fetchAllPrints(term = CURRENT_TERM): Promise<SejmPrint[]> {
  const data = await fetchWithRetry<SejmPrint[]>(`${SEJM_API_BASE}/term${term}/prints`)
  return data || []
}

export async function fetchPrint(number: string, term = CURRENT_TERM): Promise<SejmPrint | null> {
  return fetchWithRetry<SejmPrint>(`${SEJM_API_BASE}/term${term}/prints/${number}`)
}

// Procesy legislacyjne
export async function fetchAllProcesses(term = CURRENT_TERM): Promise<SejmProcess[]> {
  const data = await fetchWithRetry<SejmProcess[]>(`${SEJM_API_BASE}/term${term}/processes`)
  return data || []
}

export async function fetchProcess(number: string, term = CURRENT_TERM): Promise<SejmProcess | null> {
  return fetchWithRetry<SejmProcess>(`${SEJM_API_BASE}/term${term}/processes/${number}`)
}

// Posiedzenia
export async function fetchAllSittings(term = CURRENT_TERM): Promise<SejmSitting[]> {
  const data = await fetchWithRetry<SejmSitting[]>(`${SEJM_API_BASE}/term${term}/proceedings`)
  return data || []
}

export async function fetchSitting(number: number, term = CURRENT_TERM): Promise<SejmSitting | null> {
  return fetchWithRetry<SejmSitting>(`${SEJM_API_BASE}/term${term}/proceedings/${number}`)
}

// Głosowania
export async function fetchVotingsForSitting(sittingNumber: number, term = CURRENT_TERM): Promise<SejmVoting[]> {
  const data = await fetchWithRetry<SejmVoting[]>(`${SEJM_API_BASE}/term${term}/votings/${sittingNumber}`)
  return data || []
}

export async function fetchVotingDetails(
  sittingNumber: number,
  votingNumber: number,
  term = CURRENT_TERM,
): Promise<SejmVotingDetails | null> {
  return fetchWithRetry<SejmVotingDetails>(`${SEJM_API_BASE}/term${term}/votings/${sittingNumber}/${votingNumber}`)
}

// Komisje
export async function fetchAllCommittees(term = CURRENT_TERM): Promise<SejmCommittee[]> {
  const data = await fetchWithRetry<SejmCommittee[]>(`${SEJM_API_BASE}/term${term}/committees`)
  return data || []
}

// Pomocnicze
export function getPhotoUrl(mpId: number, term = CURRENT_TERM, mini = false): string {
  return `${SEJM_API_BASE}/term${term}/MP/${mpId}/photo${mini ? "-mini" : ""}`
}

export function getPrintAttachmentUrl(printNumber: string, attachmentName: string, term = CURRENT_TERM): string {
  return `${SEJM_API_BASE}/term${term}/prints/${printNumber}/${attachmentName}`
}

// Mapowanie typów projektów
export function mapProjectType(documentType?: string): string {
  if (!documentType) return "unknown"

  const type = documentType.toLowerCase()
  if (type.includes("rządowy")) return "government"
  if (type.includes("poselski")) return "deputies"
  if (type.includes("senacki") || type.includes("senat")) return "senate"
  if (type.includes("prezydent")) return "president"
  if (type.includes("obywatel")) return "citizens"
  if (type.includes("komisj")) return "committee"
  return "other"
}

// Mapowanie etapów procesu
export function mapStageName(stageName: string): string {
  const stageMap: Record<string, string> = {
    "Projekt wpłynął do Sejmu": "initiative",
    "Skierowano do I czytania na posiedzeniu Sejmu": "reading_1_referral",
    "Skierowano do I czytania w komisjach": "reading_1_committee_referral",
    "I czytanie na posiedzeniu Sejmu": "reading_1",
    "I czytanie w komisjach": "reading_1_committee",
    "Praca w komisjach po I czytaniu": "committee_work_1",
    "II czytanie na posiedzeniu Sejmu": "reading_2",
    "Praca w komisjach po II czytaniu": "committee_work_2",
    "III czytanie na posiedzeniu Sejmu": "reading_3",
    "Stanowisko Senatu": "senate_position",
    "Praca w komisjach nad stanowiskiem Senatu": "committee_senate",
    "Rozpatrywanie na forum Sejmu stanowiska Senatu": "sejm_senate_position",
    "Ustawę przekazano Prezydentowi do podpisu": "president_signature",
    "Prezydent podpisał ustawę": "president_signed",
    "Ustawa ogłoszona": "published",
    "Prezydent skierował ustawę do Trybunału Konstytucyjnego": "constitutional_tribunal",
    "Wniosek Prezydenta (VETO)": "president_veto",
  }

  return stageMap[stageName] || stageName
}
