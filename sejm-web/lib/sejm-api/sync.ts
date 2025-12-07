import { createClient } from "@supabase/supabase-js"
import {
  fetchAllMPs,
  fetchAllClubs,
  fetchAllPrints,
  fetchAllProcesses,
  fetchProcess,
  fetchAllSittings,
  fetchVotingsForSitting,
  fetchAllCommittees,
  mapProjectType,
} from "./client"

const CURRENT_TERM = 10

// Używamy service role key do zapisu (wymaga env var SUPABASE_SERVICE_ROLE_KEY)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SEJMSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase credentials for sync")
  }

  return createClient(url, serviceKey)
}

export interface SyncResult {
  success: boolean
  type: string
  processed: number
  created: number
  updated: number
  errors: string[]
  duration: number
}

// Synchronizacja klubów
export async function syncClubs(term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "clubs",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()
    const clubs = await fetchAllClubs(term)

    for (const club of clubs) {
      result.processed++

      const { error } = await supabase.from("clubs").upsert(
        {
          id: club.id,
          term_number: term,
          name: club.name,
          members_count: club.membersCount,
          phone: club.phone,
          fax: club.fax,
          email: club.email,
        },
        { onConflict: "id,term_number" },
      )

      if (error) {
        result.errors.push(`Club ${club.id}: ${error.message}`)
      } else {
        result.created++
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Synchronizacja posłów
export async function syncMPs(term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "mps",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()
    const mps = await fetchAllMPs(term)

    for (const mp of mps) {
      result.processed++

      const { error } = await supabase.from("mps").upsert(
        {
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
          photo_url: `https://api.sejm.gov.pl/sejm/term${term}/MP/${mp.id}/photo`,
        },
        { onConflict: "id" },
      )

      if (error) {
        result.errors.push(`MP ${mp.id}: ${error.message}`)
      } else {
        result.created++
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Synchronizacja komisji
export async function syncCommittees(term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "committees",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()
    const committees = await fetchAllCommittees(term)

    for (const committee of committees) {
      result.processed++

      const { error } = await supabase.from("committees").upsert(
        {
          code: committee.code,
          term_number: term,
          name: committee.name,
          name_genitive: committee.nameGenitive,
          type: committee.type,
          phone: committee.phone,
          composition_date: committee.compositionDate,
          scope: committee.scope,
        },
        { onConflict: "code" },
      )

      if (error) {
        result.errors.push(`Committee ${committee.code}: ${error.message}`)
      } else {
        result.created++
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Synchronizacja druków
export async function syncPrints(term = CURRENT_TERM): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "prints",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()
    const prints = await fetchAllPrints(term)

    for (const print of prints) {
      result.processed++

      const { error } = await supabase.from("prints").upsert(
        {
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
        },
        { onConflict: "id" },
      )

      if (error) {
        result.errors.push(`Print ${print.number}: ${error.message}`)
      } else {
        result.created++
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Synchronizacja procesów legislacyjnych
export async function syncProcesses(term = CURRENT_TERM, fullDetails = false): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "processes",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()
    const processes = await fetchAllProcesses(term)

    for (const proc of processes) {
      result.processed++

      // Pobierz szczegóły procesu jeśli fullDetails
      let fullProcess = proc
      if (fullDetails) {
        const detailed = await fetchProcess(proc.number, term)
        if (detailed) fullProcess = detailed
      }

      // Określ status
      const lastStage = fullProcess.stages?.[fullProcess.stages.length - 1]
      const isFinished = lastStage?.stageName?.includes("ogłoszona") || lastStage?.stageName?.includes("podpisał")
      const isRejected = lastStage?.stageName?.includes("odrzuc") || lastStage?.decision?.includes("odrzuc")

      const processId = `${term}-${proc.number}`

      const { error: procError } = await supabase.from("legislative_processes").upsert(
        {
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
        },
        { onConflict: "id" },
      )

      if (procError) {
        result.errors.push(`Process ${proc.number}: ${procError.message}`)
        continue
      }

      // Zapisz etapy procesu
      if (fullProcess.stages) {
        // Usuń stare etapy
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

          if (stageError) {
            result.errors.push(`Stage ${proc.number}/${i}: ${stageError.message}`)
          } else {
            // Jeśli etap ma numery głosowań, zaktualizuj powiązane głosowania o process_id
            if (stage.votingNum && stage.votingNum.length > 0) {
              await supabase
                .from("votings")
                .update({ process_id: processId })
                .eq("term_number", term)
                .in("voting_number", stage.votingNum)
            }
          }
        }
      }

      result.created++
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Synchronizacja głosowań
export async function syncVotings(term = CURRENT_TERM, sittingNumber?: number): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: true,
    type: "votings",
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    duration: 0,
  }

  try {
    const supabase = getServiceClient()

    // Pobierz listę posiedzeń
    const sittings = await fetchAllSittings(term)
    const sittingsToSync = sittingNumber ? sittings.filter((s) => s.number === sittingNumber) : sittings

    for (const sitting of sittingsToSync) {
      // Zapisz posiedzenie
      await supabase.from("sittings").upsert(
        {
          term_number: term,
          sitting_number: sitting.number,
          title: sitting.title,
          dates: sitting.dates,
        },
        { onConflict: "term_number,sitting_number" },
      )

      // Pobierz głosowania z posiedzenia
      const votings = await fetchVotingsForSitting(sitting.number, term)

      for (const voting of votings) {
        result.processed++

        const { data: votingRecord, error: votingError } = await supabase
          .from("votings")
          .upsert(
            {
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
            },
            { onConflict: "term_number,sitting_number,voting_number" },
          )
          .select("id")
          .single()

        if (votingError) {
          result.errors.push(`Voting ${sitting.number}/${voting.votingNumber}: ${votingError.message}`)
          continue
        }

        result.created++
      }
    }
  } catch (error) {
    result.success = false
    result.errors.push(String(error))
  }

  result.duration = Date.now() - startTime
  return result
}

// Pełna synchronizacja
export async function fullSync(term = CURRENT_TERM): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // Kolejność ma znaczenie (zależności FK)
  results.push(await syncClubs(term))
  results.push(await syncMPs(term))
  results.push(await syncCommittees(term))
  results.push(await syncPrints(term))
  results.push(await syncProcesses(term, true))
  results.push(await syncVotings(term))

  return results
}

// Szybka synchronizacja (tylko zmiany)
export async function quickSync(term = CURRENT_TERM): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // Tylko procesy i głosowania (najczęściej się zmieniają)
  results.push(await syncProcesses(term, false))

  // Ostatnie posiedzenie
  const sittings = await fetchAllSittings(term)
  if (sittings.length > 0) {
    const lastSitting = sittings[sittings.length - 1]
    results.push(await syncVotings(term, lastSitting.number))
  }

  return results
}
