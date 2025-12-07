import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { fetchWithRetry, SEJM_API_BASE, CURRENT_TERM, SejmMP, SejmClub, SejmPrint, SejmProcess, SejmSitting, SejmVoting, SejmCommittee } from "./client"

export interface SyncResult {
  success: boolean
  type: string
  processed: number
  created: number
  updated: number
  errors: string[]
  duration: number
}

// Mapowanie typów projektów
function mapProjectType(documentType?: string): string {
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

export async function syncClubs(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "clubs", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const clubs = await fetchWithRetry<SejmClub[]>(`${SEJM_API_BASE}/term${term}/clubs`)
    if (!clubs) return result

    for (const club of clubs) {
      result.processed++
      const { error } = await supabase.from("clubs").upsert({
        id: club.id,
        term_number: term,
        name: club.name,
        members_count: club.membersCount,
        phone: club.phone,
        fax: club.fax,
        email: club.email,
      }, { onConflict: "id,term_number" })

      if (error) result.errors.push(`Club ${club.id}: ${error.message}`)
      else result.created++
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

export async function syncMPs(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "mps", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const mps = await fetchWithRetry<SejmMP[]>(`${SEJM_API_BASE}/term${term}/MP`)
    if (!mps) return result

    for (const mp of mps) {
      result.processed++
      const { error } = await supabase.from("mps").upsert({
        id: mp.id,
        term_number: term,
        first_name: mp.firstName,
        last_name: mp.lastName,
        second_name: mp.secondName,
        email: mp.email,
        club: mp.club,
        active: mp.active,
        birth_date: mp.birthDate,
        birth_location: mp.birthLocation,
        profession: mp.profession,
        education_level: mp.educationLevel,
        district_name: mp.districtName,
        district_num: mp.districtNum,
        voivodeship: mp.voivodeship,
        number_of_votes: mp.numberOfVotes,
        photo_url: `${SEJM_API_BASE}/term${term}/MP/${mp.id}/photo`,
      }, { onConflict: "id" })

      if (error) result.errors.push(`MP ${mp.id}: ${error.message}`)
      else result.created++
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

export async function syncCommittees(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "committees", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const committees = await fetchWithRetry<SejmCommittee[]>(`${SEJM_API_BASE}/term${term}/committees`)
    if (!committees) return result

    for (const committee of committees) {
      result.processed++
      const { error } = await supabase.from("committees").upsert({
        code: committee.code,
        term_number: term,
        name: committee.name,
        name_genitive: committee.nameGenitive,
        type: committee.type,
        phone: committee.phone,
        composition_date: committee.compositionDate,
        scope: committee.scope,
      }, { onConflict: "code" })

      if (error) result.errors.push(`Committee ${committee.code}: ${error.message}`)
      else result.created++
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

export async function syncPrints(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "prints", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const prints = await fetchWithRetry<SejmPrint[]>(`${SEJM_API_BASE}/term${term}/prints`)
    if (!prints) return result

    for (const print of prints) {
      result.processed++
      const { error } = await supabase.from("prints").upsert({
        id: `${term}-${print.number}`,
        term_number: term,
        number: print.number,
        title: print.title,
        document_date: print.documentDate,
        delivery_date: print.deliveryDate,
        document_type: print.documentType,
        change_date: print.changeDate,
        process_print: print.processPrint,
        additional_prints: print.additionalPrints || [],
        attachments: print.attachments || [],
      }, { onConflict: "id" })

      if (error) result.errors.push(`Print ${print.number}: ${error.message}`)
      else result.created++
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

export async function syncProcesses(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "processes", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    // Fetch ALL processes with high limit (API default is 50)
    const processes = await fetchWithRetry<SejmProcess[]>(`${SEJM_API_BASE}/term${term}/processes?limit=5000`)
    if (!processes) return result
    
    console.log(`[Sync] Found ${processes.length} processes to sync`)

    for (let i = 0; i < processes.length; i++) {
      const proc = processes[i]
      result.processed++
      
      // Log progress every 100 processes
      if (result.processed % 100 === 0) {
        console.log(`[Sync] Processing ${result.processed}/${processes.length} processes...`)
      }
      
      const detailed = await fetchWithRetry<SejmProcess>(`${SEJM_API_BASE}/term${term}/processes/${proc.number}`)
      const fullProcess = detailed || proc

      const lastStage = fullProcess.stages?.[fullProcess.stages.length - 1]
      const isFinished = lastStage?.stageName?.includes("ogłoszona") || lastStage?.stageName?.includes("podpisał")
      const isRejected = lastStage?.stageName?.includes("odrzuc") || lastStage?.decision?.includes("odrzuc")
      const processId = `${term}-${proc.number}`

      const { error: procError } = await supabase.from("legislative_processes").upsert({
        id: processId,
        term_number: term,
        number: proc.number,
        title: proc.title,
        description: proc.description,
        document_type: proc.documentType,
        project_type: mapProjectType(proc.documentType),
        current_stage: lastStage?.stageName,
        is_finished: isFinished,
        is_rejected: isRejected,
        ue_related: proc.UE,
        principle_of_subsidiarity: proc.principleOfSubsidiarity,
        document_date: proc.documentDate,
        change_date: proc.changeDate,
        web_generated_date: proc.webGeneratedDate,
        rcl_num: proc.rclNum,
      }, { onConflict: "id" })

      if (procError) {
        result.errors.push(`Process ${proc.number}: ${procError.message}`)
        continue
      }

      if (fullProcess.stages) {
        await supabase.from("process_stages").delete().eq("process_id", processId)
        for (let i = 0; i < fullProcess.stages.length; i++) {
          const stage = fullProcess.stages[i]
          const { error: stageError } = await supabase.from("process_stages").insert({
            process_id: processId,
            stage_name: stage.stageName,
            stage_number: stage.stageNumber || i + 1,
            date: stage.date,
            child_stages: stage.childStages || [],
            sitting_num: stage.sittingNum,
            voting_numbers: stage.votingNum || [],
            committees: stage.committees || [],
            comment: stage.comment,
          })
          if (stageError) result.errors.push(`Stage ${proc.number}/${i}: ${stageError.message}`)
        }
      }
      result.created++
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

export async function syncVotings(supabase: SupabaseClient, term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = { success: true, type: "votings", processed: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const sittings = await fetchWithRetry<SejmSitting[]>(`${SEJM_API_BASE}/term${term}/proceedings`)
    if (!sittings) return result

    for (const sitting of sittings) {
      await supabase.from("sittings").upsert({
        term_number: term,
        sitting_number: sitting.number,
        title: sitting.title,
        dates: sitting.dates,
      }, { onConflict: "term_number,sitting_number" })

      const votings = await fetchWithRetry<SejmVoting[]>(`${SEJM_API_BASE}/term${term}/votings/${sitting.number}`)
      if (!votings) continue

      for (const voting of votings) {
        result.processed++
        const { error } = await supabase.from("votings").upsert({
          term_number: term,
          sitting_number: voting.sitting,
          voting_number: voting.votingNumber,
          date: voting.date,
          topic: voting.topic,
          description: voting.description,
          kind: voting.kind,
          yes_count: voting.yes,
          no_count: voting.no,
          abstain_count: voting.abstain,
          not_participating: voting.notParticipating,
        }, { onConflict: "term_number,sitting_number,voting_number" })

        if (error) result.errors.push(`Voting ${sitting.number}/${voting.votingNumber}: ${error.message}`)
        else result.created++
      }
    }
  } catch (error) {
    result.success = false; result.errors.push(String(error))
  }
  result.duration = Date.now() - startTime
  return result
}

