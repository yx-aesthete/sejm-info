import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
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
              <CardTitle className="text-2xl">Sprawdź email</CardTitle>
              <CardDescription>Wysłaliśmy link potwierdzający</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Kliknij w link w emailu aby aktywować konto. Następnie będziesz mógł się zalogować.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
