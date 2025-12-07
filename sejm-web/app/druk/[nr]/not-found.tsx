import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DrukNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <FileQuestion className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Nie znaleziono druku</h1>
        <p className="text-muted-foreground mb-6">Druk o podanym numerze nie istnieje lub został usunięty z systemu.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Wróć do strony głównej</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/proces">Przeglądaj druki</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
