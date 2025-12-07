"""
Analiza dynamiki procesów legislacyjnych

Funkcje:
- Tempo uchwalania ustaw (średni czas przez etapy)
- Identyfikacja wąskich gardeł (które etapy trwają najdłużej)
- Przewidywanie czasu zakończenia procesu
- Analiza sezonowości (kiedy procesy są najszybsze/najwolniejsze)
- Porównanie różnych typów projektów (rządowe vs poselskie)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any
from src.database import fetch_all_processes, fetch_process_stages

def calculate_stage_durations(timeline: List[Dict]) -> Dict[str, float]:
    """
    Oblicza czas trwania każdego etapu w timeline

    Returns:
        Dict: {"nazwa_etapu": dni_trwania}
    """
    if not timeline:
        return {}

    durations = {}

    for i, node in enumerate(timeline):
        date_start = node.get("dateStart")
        date_end = node.get("dateEnd")

        if not date_start or not date_end:
            continue

        try:
            start = datetime.fromisoformat(date_start.replace("Z", "+00:00"))
            end = datetime.fromisoformat(date_end.replace("Z", "+00:00"))
            duration_days = (end - start).days

            stage_name = node.get("name", f"Stage {i+1}")
            durations[stage_name] = duration_days
        except:
            continue

    return durations

def analyze_process_dynamics():
    """
    Główna funkcja analizy dynamiki procesów

    Returns:
        Dict z wynikami analizy:
        - avg_total_duration: średni czas całego procesu
        - avg_stage_durations: średnie czasy poszczególnych etapów
        - bottlenecks: etapy, które trwają najdłużej
        - speed_by_type: tempo różnych typów projektów
        - monthly_trends: trendy miesięczne
    """
    print("[Process Dynamics] Fetching data...")
    processes = fetch_all_processes()

    if not processes:
        print("[Process Dynamics] No processes found")
        return {}

    print(f"[Process Dynamics] Analyzing {len(processes)} processes...")

    # DataFrame dla lepszej analizy
    df_data = []

    all_stage_durations = defaultdict(list)
    total_durations = []

    # Analizuj procesy według typu
    durations_by_type = defaultdict(list)

    # Analizuj według miesiąca
    monthly_finished = defaultdict(int)
    monthly_started = defaultdict(int)

    for proc in processes:
        process_id = proc.get("id")
        project_type = proc.get("project_type", "unknown")
        is_finished = proc.get("is_finished", False)
        is_rejected = proc.get("is_rejected", False)
        document_date = proc.get("document_date")
        change_date = proc.get("change_date")
        timeline = proc.get("timeline", [])

        # Oblicz całkowity czas procesu
        total_duration = None
        if is_finished and document_date and change_date:
            try:
                start = datetime.fromisoformat(document_date.replace("Z", "+00:00"))
                end = datetime.fromisoformat(change_date.replace("Z", "+00:00"))
                total_duration = (end - start).days

                if 0 < total_duration < 3650:  # Filtruj nieprawidłowe
                    total_durations.append(total_duration)
                    durations_by_type[project_type].append(total_duration)

                    # Trendy miesięczne
                    month_key = end.strftime("%Y-%m")
                    monthly_finished[month_key] += 1
            except:
                pass

        # Miesięczne rozpoczęcia
        if document_date:
            try:
                start = datetime.fromisoformat(document_date.replace("Z", "+00:00"))
                month_key = start.strftime("%Y-%m")
                monthly_started[month_key] += 1
            except:
                pass

        # Analizuj czas trwania etapów
        stage_durations = calculate_stage_durations(timeline)
        for stage_name, duration in stage_durations.items():
            if 0 <= duration <= 365:  # Filtruj outliers
                all_stage_durations[stage_name].append(duration)

        df_data.append({
            "id": process_id,
            "type": project_type,
            "is_finished": is_finished,
            "is_rejected": is_rejected,
            "total_duration": total_duration,
            "num_stages": len(timeline),
        })

    # Oblicz statystyki
    avg_total_duration = np.mean(total_durations) if total_durations else 0
    median_total_duration = np.median(total_durations) if total_durations else 0

    # Średnie czasy etapów
    avg_stage_durations = [
        {
            "stage": stage,
            "avg_days": round(np.mean(durations), 1),
            "median_days": round(np.median(durations), 1),
            "count": len(durations)
        }
        for stage, durations in all_stage_durations.items()
        if len(durations) >= 5  # Minimum 5 wystąpień
    ]

    # Sortuj po średnim czasie (wąskie gardła na górze)
    avg_stage_durations.sort(key=lambda x: x["avg_days"], reverse=True)

    # Tempo według typu projektu
    speed_by_type = [
        {
            "type": proj_type,
            "avg_days": round(np.mean(durations), 1),
            "median_days": round(np.median(durations), 1),
            "count": len(durations)
        }
        for proj_type, durations in durations_by_type.items()
        if len(durations) >= 3
    ]

    # Sortuj od najszybszych
    speed_by_type.sort(key=lambda x: x["avg_days"])

    # Trendy miesięczne
    monthly_trends = []
    for month in sorted(set(list(monthly_finished.keys()) + list(monthly_started.keys()))):
        monthly_trends.append({
            "month": month,
            "started": monthly_started.get(month, 0),
            "finished": monthly_finished.get(month, 0),
        })

    # Sortuj po dacie
    monthly_trends.sort(key=lambda x: x["month"])

    results = {
        "avg_total_duration_days": round(avg_total_duration, 1),
        "median_total_duration_days": round(median_total_duration, 1),
        "total_processes_analyzed": len(total_durations),
        "bottlenecks": avg_stage_durations[:10],  # Top 10 najwolniejszych etapów
        "fastest_stages": avg_stage_durations[-5:] if len(avg_stage_durations) > 5 else [],
        "speed_by_project_type": speed_by_type,
        "monthly_trends": monthly_trends[-12:],  # Ostatnie 12 miesięcy
        "generated_at": datetime.now().isoformat(),
    }

    print(f"[Process Dynamics] Analyzed {len(total_durations)} finished processes")
    print(f"\n⏱️  Average duration: {results['avg_total_duration_days']} days")
    print(f"⏱️  Median duration: {results['median_total_duration_days']} days")

    print(f"\n🚧 Top 5 bottlenecks (slowest stages):")
    for i, stage in enumerate(results['bottlenecks'][:5], 1):
        print(f"  {i}. {stage['stage']}: {stage['avg_days']} days (n={stage['count']})")

    print(f"\n🚀 Speed by project type:")
    for item in results['speed_by_project_type'][:5]:
        print(f"  {item['type']}: {item['avg_days']} days (n={item['count']})")

    return results

if __name__ == "__main__":
    print("=" * 60)
    print("⚡ PROCESS DYNAMICS ANALYZER")
    print("=" * 60)
    print()

    results = analyze_process_dynamics()

    print("\n✅ Analysis complete!")
