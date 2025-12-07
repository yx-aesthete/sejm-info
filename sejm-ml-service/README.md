# Sejm ML Service

Serwis ML do zaawansowanej analizy danych legislacyjnych Sejmu RP.

## Funkcje

### 📜 Analiza odwołań do ustaw (Law References)
- Wykrywanie najczęściej nowelizowanych ustaw
- Analiza sieci powiązań między ustawami
- Identyfikacja "kluczowych" ustaw
- Trendowanie: które ustawy są ostatnio często zmieniane
- Statystyki Dziennika Ustaw

### ⚡ Analiza dynamiki procesów (Process Dynamics)
- Średni czas uchwalania ustaw
- Identyfikacja wąskich gardeł (które etapy trwają najdłużej)
- Porównanie różnych typów projektów (rządowe vs poselskie vs senackie)
- Trendy miesięczne
- Przewidywanie czasu zakończenia procesu

### 🗳️ Analiza wzorców głosowań (Voting Patterns)
- Wykrywanie kontrowersyjnych ustaw (zbliżone wyniki)
- Analiza frekwencji posłów
- Identyfikacja najciasniejszych głosowań
- Statystyki pass rate
- Scoring kontrowersyjności

## Wymagania

- Python 3.11+
- Konto Supabase
- *Opcjonalnie:* Klucz API OpenAI (dla dodatkowych analiz NLP)

## Instalacja

```bash
# Utwórz środowisko wirtualne
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# lub
venv\Scripts\activate  # Windows

# Zainstaluj zależności
pip install -r requirements.txt

# Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Uzupełnij .env
```

## Konfiguracja

Edytuj plik `.env`:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key

# Opcjonalne
OPENAI_API_KEY=sk-proj-twoj_klucz_openai

ML_SERVICE_PORT=8001
LOG_LEVEL=INFO
```

## Uruchomienie

### FastAPI Server (REST API)

```bash
# Uruchom serwer
python -m src.main

# Serwer dostępny na http://localhost:8001
```

### Standalone Analyzers (CLI)

```bash
# Analiza odwołań do ustaw
python -m src.analyzers.law_references

# Analiza dynamiki procesów
python -m src.analyzers.process_dynamics

# Analiza wzorców głosowań
python -m src.analyzers.voting_patterns
```

## API Endpoints

### GET /analyze/law-references
Analiza odwołań do ustaw w drukach sejmowych.

**Response:**
```json
{
  "success": true,
  "data": {
    "most_referenced_laws": [
      {"law": "ustawa o ...", "count": 15}
    ],
    "most_amended_laws": [
      {"law": "ustawa o ...", "count": 8}
    ],
    "trending_laws_6m": [...],
    "total_unique_laws": 245,
    "total_references": 1234
  }
}
```

### GET /analyze/process-dynamics
Analiza dynamiki procesów legislacyjnych.

**Response:**
```json
{
  "success": true,
  "data": {
    "avg_total_duration_days": 180.5,
    "median_total_duration_days": 145.0,
    "bottlenecks": [
      {"stage": "Komisja", "avg_days": 60.5, "count": 120}
    ],
    "speed_by_project_type": [
      {"type": "government", "avg_days": 120.5, "count": 50}
    ],
    "monthly_trends": [...]
  }
}
```

### GET /analyze/voting-patterns
Analiza wzorców głosowań.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_votings": 1500,
    "avg_turnout_pct": 92.5,
    "avg_yes_pct": 65.3,
    "pass_rate_pct": 78.5,
    "most_controversial": [
      {
        "topic": "...",
        "controversy_score": 95.5,
        "yes_pct": 52.5,
        "no_pct": 47.5
      }
    ],
    "closest_votes": [...]
  }
}
```

### GET /analyze/all
Uruchom wszystkie analizy naraz.

## Przykłady użycia

### curl

```bash
# Analiza odwołań do ustaw
curl http://localhost:8001/analyze/law-references

# Wszystkie analizy
curl http://localhost:8001/analyze/all
```

### Python

```python
import requests

response = requests.get("http://localhost:8001/analyze/process-dynamics")
data = response.json()

print(f"Average duration: {data['data']['avg_total_duration_days']} days")
```

### JavaScript/TypeScript

```typescript
const response = await fetch("http://localhost:8001/analyze/voting-patterns")
const { data } = await response.json()

console.log(`Pass rate: ${data.pass_rate_pct}%`)
```

## Integracja z Next.js

Dodaj do swojego Next.js API:

```typescript
// app/api/ml/[analysis]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { analysis: string } }
) {
  const response = await fetch(
    `http://localhost:8001/analyze/${params.analysis}`
  )
  const data = await response.json()
  return Response.json(data)
}
```

## Rozszerzanie

Dodaj własny analyzer:

```python
# src/analyzers/my_analyzer.py
from src.database import fetch_all_processes

def analyze_my_data():
    processes = fetch_all_processes()

    # Twoja analiza...

    return {
        "my_metric": 123,
        "results": [...]
    }

if __name__ == "__main__":
    results = analyze_my_data()
    print(results)
```

Dodaj endpoint w `src/main.py`:

```python
@app.get("/analyze/my-analysis")
async def get_my_analysis():
    from src.analyzers.my_analyzer import analyze_my_data
    results = analyze_my_data()
    return AnalysisResponse(success=True, data=results)
```

## Rozwój

```bash
# Formatowanie kodu
pip install black
black src/

# Type checking
pip install mypy
mypy src/

# Linting
pip install ruff
ruff check src/
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "-m", "src.main"]
```

```bash
docker build -t sejm-ml-service .
docker run -p 8001:8001 --env-file .env sejm-ml-service
```

## Licencja

MIT
