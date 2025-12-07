"""
Sejm ML Service - FastAPI Application

Endpointy:
- GET /analyze/law-references - Analiza odwołań do ustaw
- GET /analyze/process-dynamics - Analiza dynamiki procesów
- GET /analyze/voting-patterns - Analiza wzorców głosowań
- GET /analyze/all - Uruchom wszystkie analizy
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import logging

from src.config import ML_SERVICE_PORT
from src.analyzers.law_references import analyze_law_references
from src.analyzers.process_dynamics import analyze_process_dynamics
from src.analyzers.voting_patterns import analyze_voting_patterns
from src.analyzers.success_prediction import analyze_success_factors

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Sejm ML Service",
    description="Machine Learning analytics for Polish legislative data",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    error: str | None = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Sejm ML Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/analyze/law-references", response_model=AnalysisResponse)
async def get_law_references():
    """
    Analiza odwołań do ustaw w drukach sejmowych

    Returns:
    - most_referenced_laws: najczęściej przywoływane ustawy
    - most_amended_laws: najczęściej nowelizowane
    - trending_laws_6m: ostatnio często zmieniane
    """
    try:
        logger.info("Running law references analysis...")
        results = analyze_law_references()
        return AnalysisResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Error in law references analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/process-dynamics", response_model=AnalysisResponse)
async def get_process_dynamics():
    """
    Analiza dynamiki procesów legislacyjnych

    Returns:
    - avg_total_duration_days: średni czas całego procesu
    - bottlenecks: etapy, które trwają najdłużej
    - speed_by_project_type: tempo różnych typów projektów
    - monthly_trends: trendy miesięczne
    """
    try:
        logger.info("Running process dynamics analysis...")
        results = analyze_process_dynamics()
        return AnalysisResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Error in process dynamics analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/voting-patterns", response_model=AnalysisResponse)
async def get_voting_patterns():
    """
    Analiza wzorców głosowań

    Returns:
    - avg_turnout_pct: średnia frekwencja
    - most_controversial: najbardziej kontrowersyjne głosowania
    - closest_votes: najciasniejsze wyniki
    """
    try:
        logger.info("Running voting patterns analysis...")
        results = analyze_voting_patterns()
        return AnalysisResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Error in voting patterns analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/success-prediction", response_model=AnalysisResponse)
async def get_success_prediction():
    """
    Analiza czynników sukcesu procesów legislacyjnych

    Returns:
    - success_rate_pct: ogólny wskaźnik sukcesu
    - success_by_project_type: sukces według typu projektu
    - feature_importance: najważniejsze cechy
    """
    try:
        logger.info("Running success prediction analysis...")
        results = analyze_success_factors()
        return AnalysisResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Error in success prediction analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/all", response_model=AnalysisResponse)
async def get_all_analyses():
    """
    Uruchom wszystkie analizy naraz
    """
    try:
        logger.info("Running all analyses...")

        results = {
            "law_references": analyze_law_references(),
            "process_dynamics": analyze_process_dynamics(),
            "voting_patterns": analyze_voting_patterns(),
            "success_prediction": analyze_success_factors(),
        }

        return AnalysisResponse(success=True, data=results)
    except Exception as e:
        logger.error(f"Error in running all analyses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=ML_SERVICE_PORT)
