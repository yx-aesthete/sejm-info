import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/portal/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bookmark, ArrowRight, Bell, BellOff } from "lucide-react"
import Link from "next/link"

export default async function ObserwowanePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: watchedLaws } = await supabase
    .from("watched_laws")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Obserwowane ustawy</h1>
          <p className="text-muted-foreground">
            Śledź postęp ustaw, które Cię interesują i otrzymuj powiadomienia o zmianach.
          </p>
        </div>

        {watchedLaws && watchedLaws.length > 0 ? (
          <div className="space-y-4">
            {watchedLaws.map((law) => (
              <Card key={law.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {law.druk_number}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {law.notify_on_stage_change ? (
                            <Bell className="h-3 w-3 text-primary" />
                          ) : (
                            <BellOff className="h-3 w-3" />
                          )}
                          <span>Powiadomienia {law.notify_on_stage_change ? "włączone" : "wyłączone"}</span>
                        </div>
                      </div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">{law.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dodano: {new Date(law.created_at).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/druk/${law.druk_number.replace(/\D/g, "")}`}>
                        Zobacz <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Brak obserwowanych ustaw</h3>
              <p className="text-muted-foreground mb-4">
                Dodaj ustawy do obserwowanych, aby śledzić ich postęp i otrzymywać powiadomienia.
              </p>
              <Button asChild>
                <Link href="/">Przeglądaj ustawy</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
