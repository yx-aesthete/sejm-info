"""
Predykcja sukcesu procesu legislacyjnego (ML)

Funkcje:
- Przewidywanie czy ustawa zostanie uchwalona
- Przewidywanie czasu trwania procesu
- Identyfikacja czynników sukcesu/porażki
- Feature importance (które cechy mają największy wpływ)

Wykorzystuje dane historyczne do trenowania modelu ML.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from src.database import fetch_all_processes

def extract_features(process: Dict) -> Dict[str, Any]:
    """
    Wyciąga features z procesu do uczenia maszynowego

    Features:
    - project_type (government, deputies, etc.)
    - document_type
    - urgency (normal, pilny, ekspresowy)
    - num_categories (ile kategorii)
    - timeline_length (ile etapów)
    - has_pdf_analysis (czy był PDF)
    - initiator_type
    """
    timeline = process.get("timeline", [])
    categories = process.get("categories", [])
    extended_data = process.get("extended_data", {})

    features = {
        # Basic
        "project_type": process.get("project_type", "unknown"),
        "document_type": process.get("document_type", "unknown"),
        "urgency": process.get("urgency", "normal"),

        # Complexity
        "num_categories": len(categories),
        "timeline_length": len(timeline),
        "has_description": 1 if process.get("description") else 0,

        # AI enrichment
        "has_pdf_analysis": 1 if extended_data.get("pdfAnalyzed") else 0,
        "has_ai_summary": 1 if extended_data.get("simpleSummary") else 0,
        "num_key_changes": len(extended_data.get("keyChanges", [])),
        "num_related_laws": len(extended_data.get("relatedLaws", [])),
        "num_tags": len(extended_data.get("tags", [])),

        # Impact analysis (jeśli jest)
        "has_financial_impact": 1 if extended_data.get("impact", {}).get("financial") else 0,
        "has_social_impact": 1 if extended_data.get("impact", {}).get("social") else 0,
        "has_economic_impact": 1 if extended_data.get("impact", {}).get("economic") else 0,
    }

    # Target variables
    features["is_finished"] = 1 if process.get("is_finished") else 0
    features["is_rejected"] = 1 if process.get("is_rejected") else 0
    features["is_successful"] = 1 if (process.get("is_finished") and not process.get("is_rejected")) else 0

    return features

def analyze_success_factors():
    """
    Analizuje czynniki sukcesu procesów legislacyjnych
    (bez użycia ML - statystyczna analiza)
    """
    print("[Success Prediction] Fetching data...")
    processes = fetch_all_processes()

    if not processes:
        print("[Success Prediction] No processes found")
        return {}

    print(f"[Success Prediction] Analyzing {len(processes)} processes...")

    # Wyciągnij features
    features_list = []
    for proc in processes:
        features = extract_features(proc)
        features_list.append(features)

    df = pd.DataFrame(features_list)

    # Oblicz statystyki
    total_processes = len(df)
    finished = df["is_finished"].sum()
    rejected = df["is_rejected"].sum()
    successful = df["is_successful"].sum()

    success_rate = (successful / total_processes * 100) if total_processes > 0 else 0
    rejection_rate = (rejected / total_processes * 100) if total_processes > 0 else 0

    # Analiza według project_type
    success_by_type = df.groupby("project_type")["is_successful"].agg(["sum", "count", "mean"])
    success_by_type["success_rate_pct"] = success_by_type["mean"] * 100
    success_by_type = success_by_type.sort_values("success_rate_pct", ascending=False)

    # Analiza według urgency
    success_by_urgency = df.groupby("urgency")["is_successful"].agg(["sum", "count", "mean"])
    success_by_urgency["success_rate_pct"] = success_by_urgency["mean"] * 100
    success_by_urgency = success_by_urgency.sort_values("success_rate_pct", ascending=False)

    # Feature importance (korelacja z sukcesem)
    numeric_features = [
        "num_categories", "timeline_length", "has_description",
        "has_pdf_analysis", "has_ai_summary", "num_key_changes",
        "num_related_laws", "num_tags", "has_financial_impact",
        "has_social_impact", "has_economic_impact"
    ]

    feature_correlations = []
    for feat in numeric_features:
        if feat in df.columns:
            corr = df[feat].corr(df["is_successful"])
            if not np.isnan(corr):
                feature_correlations.append({
                    "feature": feat,
                    "correlation": round(corr, 3)
                })

    feature_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # Średnie wartości dla successful vs rejected
    successful_processes = df[df["is_successful"] == 1]
    rejected_processes = df[df["is_rejected"] == 1]

    avg_timeline_successful = successful_processes["timeline_length"].mean()
    avg_timeline_rejected = rejected_processes["timeline_length"].mean()

    results = {
        "overall_stats": {
            "total_processes": int(total_processes),
            "finished": int(finished),
            "successful": int(successful),
            "rejected": int(rejected),
            "success_rate_pct": round(success_rate, 1),
            "rejection_rate_pct": round(rejection_rate, 1),
        },
        "success_by_project_type": [
            {
                "type": idx,
                "successful": int(row["sum"]),
                "total": int(row["count"]),
                "success_rate_pct": round(row["success_rate_pct"], 1)
            }
            for idx, row in success_by_type.iterrows()
        ],
        "success_by_urgency": [
            {
                "urgency": idx,
                "successful": int(row["sum"]),
                "total": int(row["count"]),
                "success_rate_pct": round(row["success_rate_pct"], 1)
            }
            for idx, row in success_by_urgency.iterrows()
        ],
        "feature_importance": feature_correlations[:10],
        "insights": {
            "avg_timeline_successful": round(avg_timeline_successful, 1) if not np.isnan(avg_timeline_successful) else 0,
            "avg_timeline_rejected": round(avg_timeline_rejected, 1) if not np.isnan(avg_timeline_rejected) else 0,
        },
        "generated_at": pd.Timestamp.now().isoformat(),
    }

    print(f"[Success Prediction] Overall success rate: {results['overall_stats']['success_rate_pct']}%")
    print(f"[Success Prediction] Rejection rate: {results['overall_stats']['rejection_rate_pct']}%")

    print(f"\n📊 Success rate by project type:")
    for item in results['success_by_project_type'][:5]:
        print(f"  {item['type']}: {item['success_rate_pct']}% ({item['successful']}/{item['total']})")

    print(f"\n🔍 Top features correlated with success:")
    for item in results['feature_importance'][:5]:
        print(f"  {item['feature']}: {item['correlation']}")

    return results

if __name__ == "__main__":
    print("=" * 60)
    print("🎯 SUCCESS PREDICTION ANALYZER")
    print("=" * 60)
    print()

    results = analyze_success_factors()

    print("\n✅ Analysis complete!")
