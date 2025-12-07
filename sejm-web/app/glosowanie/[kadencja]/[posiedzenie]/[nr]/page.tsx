import Link from "next/link"
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle, MinusCircle, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ParliamentHemicycle } from "@/components/parliament-hemicycle"
import { SEJM_PARTIES, SEJM_COMPOSITION } from "@/lib/parliament-data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kadencja: string; posiedzenie: string; nr: string }>
}) {
  const { kadencja, posiedzenie, nr } = await params
  return {
    title: `Głosowanie nr ${nr} | Posiedzenie ${posiedzenie} | ${kadencja} kadencja | sejm.info`,
    description: `Wyniki głosowania nr ${nr} na ${posiedzenie}. posiedzeniu Sejmu ${kadencja}. kadencji`,
  }
}

export default async function GlosowaniePage({
  params,
}: {
  params: Promise<{ kadencja: string; posiedzenie: string; nr: string }>
}) {
  const { kadencja, posiedzenie, nr } = await params

  // Mock voting data - w przyszłości zastąpione danymi ze scrapera
  const voting = {
    id: `${kadencja}-${posiedzenie}-${nr}`,
    kadencja: Number.parseInt(kadencja),
    posiedzenie: Number.parseInt(posiedzenie),
    nr: Number.parseInt(nr),
    date: "2024-11-27",
    time: "12:34",
    topic: "Głosowanie nad całością projektu ustawy o zmianie ustawy o świadczeniach opieki zdrowotnej",
    result: "accepted" as const,
    votes: {
      for: 248,
      against: 180,
      abstained: 20,
      absent: 12,
    },
    quorum: 230,
    majority: "zwykła" as const,
    relatedDruk: "764",
  }

  const total = voting.votes.for + voting.votes.against + voting.votes.abstained + voting.votes.absent
  const passed = voting.votes.for > voting.votes.against

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold">Głosowanie nr {nr}</h1>
              <p className="text-sm text-muted-foreground">
                {kadencja}. kadencja • Posiedzenie {posiedzenie}
              </p>
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-sm">
              {passed ? "Przyjęte" : "Odrzucone"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(voting.date).toLocaleDateString("pl-PL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              o godz. {voting.time}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-4">{voting.topic}</h2>
          {voting.relatedDruk && (
            <Link href={`/druk/${voting.relatedDruk}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Druk nr {voting.relatedDruk} →
              </Badge>
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Results summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Wyniki głosowania
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-3xl font-bold text-green-600">{voting.votes.for}</p>
                    <p className="text-sm text-muted-foreground">Za</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-3xl font-bold text-red-600">{voting.votes.against}</p>
                    <p className="text-sm text-muted-foreground">Przeciw</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <MinusCircle className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-3xl font-bold text-amber-600">{voting.votes.abstained}</p>
                    <p className="text-sm text-muted-foreground">Wstrzymało się</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  <UserX className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="text-3xl font-bold text-gray-600">{voting.votes.absent}</p>
                    <p className="text-sm text-muted-foreground">Nieobecnych</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Łącznie głosowało:</span>
                  <span className="font-medium">
                    {total - voting.votes.absent} / {total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wymagane kworum:</span>
                  <span className="font-medium">{voting.quorum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wymagana większość:</span>
                  <span className="font-medium capitalize">{voting.majority}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parliament visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Rozkład głosów w Sejmie</CardTitle>
            </CardHeader>
            <CardContent>
              <ParliamentHemicycle composition={SEJM_COMPOSITION} votingResult={voting.votes} />
            </CardContent>
          </Card>
        </div>

        {/* Voting by party - placeholder */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Głosowanie według klubów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SEJM_PARTIES.map((party) => {
                // Mock party voting - w przyszłości prawdziwe dane
                const partyFor = Math.floor(party.seats * 0.6)
                const partyAgainst = Math.floor(party.seats * 0.3)
                const partyAbstained = party.seats - partyFor - partyAgainst

                return (
                  <div key={party.name} className="flex items-center gap-4">
                    <div className="w-40 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: party.color }} />
                      <span className="font-medium text-sm">{party.shortName}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(partyFor / party.seats) * 100}%` }}
                          title={`Za: ${partyFor}`}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(partyAgainst / party.seats) * 100}%` }}
                          title={`Przeciw: ${partyAgainst}`}
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${(partyAbstained / party.seats) * 100}%` }}
                          title={`Wstrzymało się: ${partyAbstained}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {partyFor}/{partyAgainst}/{partyAbstained}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
