// Database types for the sync service

export interface DbProcess {
  id: string
  term_number: number
  number: string
  title: string
  description?: string
  document_type?: string
  project_type: string
  current_stage?: string
  is_finished: boolean
  is_rejected: boolean
  document_date?: string
  change_date?: string
  created_at?: string
  updated_at?: string
  timeline?: any
  categories?: string[]
  urgency?: string
  extended_data?: any
}

export interface DbProcessStage {
  id: number
  process_id: string
  stage_name: string
  stage_number: number
  date?: string
  child_stages?: any[]
  sitting_num?: number
  voting_numbers?: number[]
  committees?: string[]
  comment?: string
}

export interface DbVoting {
  id?: number
  term_number: number
  sitting_number: number
  voting_number: number
  date: string
  topic?: string
  description?: string
  kind?: string
  yes_count: number
  no_count: number
  abstain_count: number
  not_participating: number
  process_id?: string
}

export interface DbPrint {
  id: string
  term_number: number
  number: string
  title: string
  document_date?: string
  delivery_date?: string
  document_type?: string
  change_date?: string
  process_print?: string[]
  additional_prints?: string[]
  attachments?: any[]
}

// Timeline types
export type SymbolShape = "circle" | "rectangle" | "rounded-rect" | "diamond" | "double-circle" | "circle-x"
export type StageStatus = "completed" | "current" | "future" | "alternative"
export type Institution = "sejm" | "senat" | "prezydent" | "publikacja" | "trybunal"

export interface TimelineNode {
  id: string
  name: string
  shortName?: string
  description?: string
  dateStart: string
  dateEnd: string
  shape: SymbolShape
  institution: Institution
  status: StageStatus
  votingResult?: {
    for: number
    against: number
    abstained: number
  }
  legalBasis?: string
  documentNumber?: string
  alternatives?: TimelineNode[]
}

export type LegislativeCategory =
  | "finanse"
  | "zdrowie"
  | "edukacja"
  | "infrastruktura"
  | "bezpieczenstwo"
  | "srodowisko"
  | "praca"
  | "kultura"
  | "cyfryzacja"
  | "rolnictwo"
  | "sprawiedliwosc"
  | "inne"

export type Urgency = "normal" | "pilny" | "ekspresowy"

