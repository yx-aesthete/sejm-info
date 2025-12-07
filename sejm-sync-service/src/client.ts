export const SEJM_API_BASE = "https://api.sejm.gov.pl/sejm"
export const CURRENT_TERM = 10

export async function fetchWithRetry<T>(url: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data as T
    } catch (error) {
      console.error(`[SejmAPI] Attempt ${i + 1} failed for ${url}:`, error)
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return null
}

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

