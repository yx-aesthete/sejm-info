import { redirect } from "next/navigation"

export const metadata = {
  title: "Przebieg procesu legislacyjnego | sejm.info",
  description: "Przeglądaj procesy legislacyjne w Sejmie RP",
}

export default function ProcesPage() {
  // Przekierowanie na stronę główną z galerią ustaw
  redirect("/")
}
