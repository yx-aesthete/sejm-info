"""
Analiza wzorców głosowań

Funkcje:
- Wykrywanie tendencji głosowania (jak ciasne są wyniki)
- Identyfikacja kontrowersyjnych ustaw (zbliżone wyniki)
- Analiza frekwencji (ile posłów bierze udział)
- Wykrywanie anomalii (nietypowe wzorce głosowania)
- Przewidywanie wyniku głosowania na podstawie cech ustawy
"""

import pandas as pd
import numpy as np
from collections import defaultdict
from typing import List, Dict, Any
from src.database import fetch_all_processes, fetch_all_votings

def calculate_voting_metrics(voting: Dict) -> Dict[str, Any]:
    """
    Oblicza metryki dla pojedynczego głosowania
    """
    yes = voting.get("yes_count", 0)
    no = voting.get("no_count", 0)
    abstain = voting.get("abstain_count", 0)
    not_participating = voting.get("not_participating", 0)

    total_votes = yes + no + abstain
    total_mps = total_votes + not_participating

    if total_votes == 0:
        return {}

    # Procentowy wynik
    yes_pct = (yes / total_votes) * 100 if total_votes > 0 else 0
    no_pct = (no / total_votes) * 100 if total_votes > 0 else 0
    abstain_pct = (abstain / total_votes) * 100 if total_votes > 0 else 0

    # Frekwencja
    turnout_pct = (total_votes / total_mps) * 100 if total_mps > 0 else 0

    # Kontrowersyjność (im bliżej 50-50, tym bardziej kontrowersyjne)
    # Wartość od 0 (jednogłośne) do 100 (idealny remis)
    controversy_score = 100 - abs(yes_pct - no_pct)

    # Margin of victory
    margin = abs(yes - no)
    margin_pct = (margin / total_votes) * 100 if total_votes > 0 else 0

    return {
        "yes_pct": round(yes_pct, 1),
        "no_pct": round(no_pct, 1),
        "abstain_pct": round(abstain_pct, 1),
        "turnout_pct": round(turnout_pct, 1),
        "controversy_score": round(controversy_score, 1),
        "margin": margin,
        "margin_pct": round(margin_pct, 1),
        "total_votes": total_votes,
        "is_passed": yes > no,
    }

def analyze_voting_patterns():
    """
    Główna funkcja analizy wzorców głosowań
    """
    print("[Voting Patterns] Fetching data...")
    processes = fetch_all_processes()
    votings = fetch_all_votings()

    if not votings:
        print("[Voting Patterns] No votings found")
        return {}

    print(f"[Voting Patterns] Analyzing {len(votings)} votings from {len(processes)} processes...")

    # Przygotuj metryki
    all_metrics = []
    controversial_votes = []
    high_turnout_votes = []
    close_votes = []

    # Zgrupuj głosowania według process_id
    votes_by_process = defaultdict(list)

    for voting in votings:
        metrics = calculate_voting_metrics(voting)
        if not metrics:
            continue

        process_id = voting.get("process_id")
        voting_data = {
            **voting,
            **metrics
        }

        all_metrics.append(metrics)

        if process_id:
            votes_by_process[process_id].append(voting_data)

        # Kontrowersyjne (>70 controversy score)
        if metrics["controversy_score"] > 70:
            controversial_votes.append({
                "topic": voting.get("topic", ""),
                "date": voting.get("date", ""),
                "controversy_score": metrics["controversy_score"],
                "yes_pct": metrics["yes_pct"],
                "no_pct": metrics["no_pct"],
            })

        # Wysoka frekwencja (>95%)
        if metrics["turnout_pct"] > 95:
            high_turnout_votes.append({
                "topic": voting.get("topic", ""),
                "date": voting.get("date", ""),
                "turnout_pct": metrics["turnout_pct"],
            })

        # Ciasne głosowania (margin <5%)
        if 0 < metrics["margin_pct"] < 5:
            close_votes.append({
                "topic": voting.get("topic", ""),
                "date": voting.get("date", ""),
                "margin_pct": metrics["margin_pct"],
                "yes": voting.get("yes_count", 0),
                "no": voting.get("no_count", 0),
            })

    # Statystyki ogólne
    if all_metrics:
        avg_turnout = np.mean([m["turnout_pct"] for m in all_metrics])
        avg_yes_pct = np.mean([m["yes_pct"] for m in all_metrics])
        avg_controversy = np.mean([m["controversy_score"] for m in all_metrics])
        pass_rate = np.mean([m["is_passed"] for m in all_metrics]) * 100
    else:
        avg_turnout = avg_yes_pct = avg_controversy = pass_rate = 0

    # Sortuj listy
    controversial_votes.sort(key=lambda x: x["controversy_score"], reverse=True)
    close_votes.sort(key=lambda x: x["margin_pct"])
    high_turnout_votes.sort(key=lambda x: x["turnout_pct"], reverse=True)

    results = {
        "total_votings": len(votings),
        "avg_turnout_pct": round(avg_turnout, 1),
        "avg_yes_pct": round(avg_yes_pct, 1),
        "avg_controversy_score": round(avg_controversy, 1),
        "pass_rate_pct": round(pass_rate, 1),
        "most_controversial": controversial_votes[:10],
        "closest_votes": close_votes[:10],
        "highest_turnout": high_turnout_votes[:10],
        "generated_at": datetime.now().isoformat() if 'datetime' in dir() else None,
    }

    print(f"[Voting Patterns] Total votings: {results['total_votings']}")
    print(f"\n📊 Average turnout: {results['avg_turnout_pct']}%")
    print(f"📊 Average YES vote: {results['avg_yes_pct']}%")
    print(f"📊 Pass rate: {results['pass_rate_pct']}%")
    print(f"📊 Average controversy: {results['avg_controversy_score']}/100")

    print(f"\n🔥 Top 5 most controversial votes:")
    for i, vote in enumerate(results['most_controversial'][:5], 1):
        print(f"  {i}. {vote['topic'][:60]}... (score: {vote['controversy_score']})")

    print(f"\n⚖️  Top 5 closest votes:")
    for i, vote in enumerate(results['closest_votes'][:5], 1):
        print(f"  {i}. {vote['topic'][:60]}... (margin: {vote['margin_pct']}%)")

    return results

if __name__ == "__main__":
    from datetime import datetime
    print("=" * 60)
    print("🗳️  VOTING PATTERNS ANALYZER")
    print("=" * 60)
    print()

    results = analyze_voting_patterns()

    print("\n✅ Analysis complete!")
