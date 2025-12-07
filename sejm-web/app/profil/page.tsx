import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/portal/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_CONFIG, type LegislativeCategory } from "@/lib/legislative-extended-schema"

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: watchedLaws } = await supabase.from("watched_laws").select("*").eq("user_id", user.id)

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user.user_metadata?.full_name || "User"}
                />
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.user_metadata?.full_name || "Użytkownik"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dołączył: {new Date(user.created_at).toLocaleDateString("pl-PL")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Statystyki</CardTitle>
              <CardDescription>Twoja aktywność na platformie</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Obserwowane ustawy</dt>
                  <dd className="font-medium">{watchedLaws?.length || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Powiadomienia</dt>
                  <dd className="font-medium">{profile?.notification_preferences?.email ? "Włączone" : "Wyłączone"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zainteresowania</CardTitle>
              <CardDescription>Kategorie, które Cię interesują</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.favorite_categories && profile.favorite_categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_categories.map((cat: LegislativeCategory) => {
                    const config = CATEGORY_CONFIG[cat]
                    if (!config) return null
                    const IconComponent = config.icon
                    return (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="flex items-center gap-1"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color,
                        }}
                      >
                        <IconComponent className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nie wybrano jeszcze żadnych kategorii. Możesz je ustawić w ustawieniach.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
