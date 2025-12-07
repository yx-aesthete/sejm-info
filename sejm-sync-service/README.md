# Sejm Sync Service

Backend service synchronizujący dane z API Sejmu do Supabase z automatycznym wzbogacaniem danymi AI.

## Funkcje

- ✅ Synchronizacja procesów legislacyjnych z API Sejmu
- ✅ Automatyczne budowanie timeline procesów
- ✅ Klasyfikacja procesów (kategorie, pilność)
- 🤖 **AI-powered podsumowania** (OpenAI GPT-4)
  - Proste podsumowania dla obywateli
  - Szczegółowe wyjaśnienia
  - Kluczowe zmiany
  - Automatyczne tagowanie

## Wymagania

- Node.js 18+
- Konto Supabase
- *Opcjonalnie:* Klucz API OpenAI (dla AI podsumowań)

## Instalacja

```bash
# Zainstaluj zależności
npm install

# Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Uzupełnij .env swoimi danymi
```

## Konfiguracja

Edytuj plik `.env`:

```env
# Supabase (wymagane)
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key

# OpenAI (opcjonalne - dla AI podsumowań)
OPENAI_API_KEY=sk-proj-twoj_klucz_openai
```

### Bez OpenAI

Jeśli nie podasz `OPENAI_API_KEY`, serwis **nadal będzie działać**, ale:
- ✅ Timeline będzie generowany
- ✅ Kategorie i pilność będą wykrywane
- ❌ Brak AI podsumowań i tagów

## Uruchomienie

```bash
# Pełna synchronizacja (pobieranie danych z API Sejmu + enrichment)
npm run dev

# 🤖 TYLKO enrichment AI dla 50 najnowszych procesów (ZALECANE DO TESTÓW)
npm run enrich

# Build produkcyjny
npm run build
npm start
```

### ⚡ Szybki start - tylko AI enrichment

Jeśli chcesz tylko wygenerować AI podsumowania dla 50 najnowszych procesów **bez synchronizacji całego API**:

```bash
npm run enrich
```

**Czas wykonania:** ~2-5 minut (50 procesów × pobieranie PDF + analiza AI)
**Koszt:** ~$0.10-0.30 (50 procesów × GPT-4o-mini z PDF)

To wygeneruje:
- ✅ Timeline z wszystkich etapów (druki, głosowania, daty)
- ✅ Kategorie i pilność
- 📄 **Pobieranie i analiza PDF druków** (pierwsze 50k znaków)
- 🤖 **PEŁNA analiza AI** z treści PDF:
  - `simpleSummary` - krótkie podsumowanie
  - `simpleExplanation` - szczegółowe wyjaśnienie dla obywateli
  - `keyChanges` - lista kluczowych zmian
  - `tags` - słowa kluczowe
  - `initiatorName` - nazwa inicjatora
  - **`impact`** - analiza wpływu:
    - `financial` - wpływ budżetowy (w mln PLN)
    - `social` - grupy dotknięte, efekty pozytywne i negatywne
    - `economic` - sektory, wpływ na PKB, miejsca pracy
    - `environmental` - wpływ na środowisko (CO2, opis)
  - `relatedLaws` - powiązane ustawy (nowelizacje, uchylenia, etc.)

## Jak to działa?

### 1. Synchronizacja danych (`src/sync.ts`)
- Pobiera procesy legislacyjne z API Sejmu
- Zapisuje do Supabase (tabele: `legislative_processes`, `process_stages`)

### 2. Wzbogacanie danych (`src/enrichment/`)

#### Timeline (`timeline.ts`)
- Analizuje etapy procesu
- Buduje strukturę timeline z wydarzeniami
- Dodaje kształty (circle, diamond, etc.) i kolory instytucji

#### Klasyfikator (`classifier.ts`)
- Wykrywa kategorie (zdrowie, finanse, edukacja, etc.)
- Określa pilność (normal, pilny, ekspresowy)

#### AI Summarizer (`ai-summarizer.ts`) 🤖
- Generuje proste podsumowanie w języku obywatela
- Tłumaczy terminy prawnicze na zrozumiały język
- Wyciąga kluczowe zmiany
- Dodaje tagi

## Struktura bazy danych

Dane zapisywane w `legislative_processes`:

```typescript
{
  id: string
  title: string
  timeline: TimelineNode[]       // Wygenerowany timeline
  categories: string[]            // np. ["zdrowie", "finanse"]
  urgency: string                 // "normal" | "pilny" | "ekspresowy"
  extended_data: {
    simpleSummary: string        // AI: Proste podsumowanie
    simpleExplanation: string    // AI: Szczegółowe wyjaśnienie
    keyChanges: string[]         // AI: Lista kluczowych zmian
    tags: string[]               // AI: Tagi
    analyzed_at: string          // Data analizy
  }
}
```

## Koszty OpenAI

- Model: `gpt-4o-mini` (najtańszy GPT-4)
- ~1000 tokenów na proces
- Koszt: ~$0.0001 - $0.0005 za proces
- Dla 2000 procesów: **~$0.20 - $1.00**

## Rate Limiting

AI summarizer czeka 1 sekundę między requestami aby nie przekroczyć limitów API.

## Rozwój

```bash
# Test połączenia
npm run test

# Deweloperski mode z hot reload
npm run dev
```

## Licencja

MIT
