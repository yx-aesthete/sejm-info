"""
Analiza odwołań do ustaw w drukach sejmowych

Funkcje:
- Wykrywanie najczęściej nowelizowanych ustaw
- Analiza sieci powiązań między ustawami
- Identyfikacja "kluczowych" ustaw (najczęściej modyfikowanych)
- Trendowanie: które ustawy są ostatnio często zmieniane
"""

import re
import pandas as pd
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any
from src.database import fetch_all_processes, save_analysis_results

# Regex patterns for detecting law references in Polish legislative text
LAW_PATTERNS = [
    # "ustawy z dnia 12 grudnia 2019 r. o ..."
    r'ustaw[yaęyź]\s+z\s+dnia\s+(\d{1,2}\s+\w+\s+\d{4})\s+r\.\s+([^(]+?)(?:\(|$)',

    # "ustawy z dnia 12.12.2019 r."
    r'ustaw[yaęyź]\s+z\s+dnia\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+r\.',

    # "(Dz. U. z 2020 r. poz. 1234)"
    r'\(Dz\.\s*U\.\s+z\s+(\d{4})\s+r\.\s+poz\.\s+(\d+)',

    # Nowelizacje
    r'nowelizacj[ęai]\s+ustaw[yaęyź]\s+([^,\.]+)',

    # Uchylenia
    r'uchyl(?:a|enia|enie)\s+ustaw[yaęyź]\s+([^,\.]+)',
]

def extract_law_references(text: str) -> List[Dict[str, str]]:
    """
    Wyciąga odwołania do ustaw z tekstu

    Returns:
        Lista słowników: [{"reference": "ustawa o ...", "type": "nowelizacja", "dz_u": "Dz.U. 2020 poz. 123"}]
    """
    if not text:
        return []

    references = []

    # Dz.U. references
    for match in re.finditer(LAW_PATTERNS[2], text, re.IGNORECASE):
        year, pos = match.groups()
        references.append({
            "reference": f"Dz.U. {year} poz. {pos}",
            "type": "reference",
            "year": int(year),
            "position": int(pos)
        })

    # Nowelizacje
    for match in re.finditer(LAW_PATTERNS[3], text, re.IGNORECASE):
        law_name = match.group(1).strip()
        references.append({
            "reference": law_name,
            "type": "nowelizacja",
        })

    # Uchylenia
    for match in re.finditer(LAW_PATTERNS[4], text, re.IGNORECASE):
        law_name = match.group(1).strip()
        references.append({
            "reference": law_name,
            "type": "uchylenie",
        })

    return references

def analyze_law_references():
    """
    Główna funkcja analizy odwołań do ustaw

    Returns:
        Dict z wynikami analizy:
        - most_referenced: najczęściej przywoływane ustawy
        - most_amended: najczęściej nowelizowane
        - trending: ostatnio często zmieniane
        - reference_network: sieć powiązań
    """
    print("[Law References] Fetching data...")
    processes = fetch_all_processes()

    if not processes:
        print("[Law References] No processes found")
        return {}

    print(f"[Law References] Analyzing {len(processes)} processes...")

    # Counters
    all_references = Counter()
    amendment_references = Counter()
    repeal_references = Counter()
    dz_u_references = Counter()

    # Powiązania między procesami a ustawami
    process_law_network = defaultdict(list)

    # Trendy czasowe (ostatnie 6 miesięcy)
    six_months_ago = datetime.now() - timedelta(days=180)
    recent_references = Counter()

    for proc in processes:
        process_id = proc.get("id")
        process_number = proc.get("number")
        change_date = proc.get("change_date")

        # Sprawdź extended_data.relatedLaws (z AI)
        extended_data = proc.get("extended_data", {})
        related_laws = extended_data.get("relatedLaws", [])

        for law in related_laws:
            law_title = law.get("title", "").strip()
            relation_type = law.get("relation", "")
            dz_u = law.get("dziennikUstaw", "")

            if law_title:
                all_references[law_title] += 1
                process_law_network[process_number].append({
                    "law": law_title,
                    "relation": relation_type,
                    "dz_u": dz_u
                })

                if relation_type == "nowelizuje":
                    amendment_references[law_title] += 1
                elif relation_type == "uchyla":
                    repeal_references[law_title] += 1

                if dz_u:
                    dz_u_references[dz_u] += 1

                # Trendy
                if change_date:
                    try:
                        proc_date = datetime.fromisoformat(change_date.replace("Z", "+00:00"))
                        if proc_date > six_months_ago:
                            recent_references[law_title] += 1
                    except:
                        pass

    # Przygotuj wyniki
    results = {
        "most_referenced_laws": [
            {"law": law, "count": count}
            for law, count in all_references.most_common(20)
        ],
        "most_amended_laws": [
            {"law": law, "count": count}
            for law, count in amendment_references.most_common(20)
        ],
        "most_repealed_laws": [
            {"law": law, "count": count}
            for law, count in repeal_references.most_common(10)
        ],
        "trending_laws_6m": [
            {"law": law, "count": count}
            for law, count in recent_references.most_common(10)
        ],
        "dz_u_distribution": [
            {"dz_u": dz_u, "count": count}
            for dz_u, count in dz_u_references.most_common(20)
        ],
        "total_unique_laws": len(all_references),
        "total_references": sum(all_references.values()),
        "generated_at": datetime.now().isoformat(),
    }

    print(f"[Law References] Found {results['total_unique_laws']} unique laws")
    print(f"[Law References] Total references: {results['total_references']}")
    print(f"\n📊 Top 5 most referenced laws:")
    for i, item in enumerate(results['most_referenced_laws'][:5], 1):
        print(f"  {i}. {item['law']} ({item['count']} refs)")

    print(f"\n🔧 Top 5 most amended laws:")
    for i, item in enumerate(results['most_amended_laws'][:5], 1):
        print(f"  {i}. {item['law']} ({item['count']} amendments)")

    return results

if __name__ == "__main__":
    print("=" * 60)
    print("📜 LAW REFERENCES ANALYZER")
    print("=" * 60)
    print()

    results = analyze_law_references()

    # Opcjonalnie: zapisz do Supabase
    # save_analysis_results("ml_analysis_results", {
    #     "analysis_type": "law_references",
    #     "results": results
    # })

    print("\n✅ Analysis complete!")
