import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
              sejm.info
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Wystąpił błąd</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Kod błędu: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Wystąpił nieznany błąd podczas uwierzytelniania.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
