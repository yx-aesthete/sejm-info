"""Database client for Supabase"""
from supabase import create_client, Client
from src.config import SUPABASE_URL, SUPABASE_KEY

_supabase_client: Client | None = None

def get_supabase() -> Client:
    """Get or create Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client

def fetch_all_processes():
    """Fetch all legislative processes with extended data"""
    supabase = get_supabase()
    response = supabase.table("legislative_processes").select("*").execute()
    return response.data

def fetch_all_prints():
    """Fetch all prints"""
    supabase = get_supabase()
    response = supabase.table("prints").select("*").execute()
    return response.data

def fetch_all_votings():
    """Fetch all votings"""
    supabase = get_supabase()
    response = supabase.table("votings").select("*").execute()
    return response.data

def fetch_process_stages():
    """Fetch all process stages"""
    supabase = get_supabase()
    response = supabase.table("process_stages").select("*").execute()
    return response.data

def save_analysis_results(table: str, data: dict):
    """Save analysis results to Supabase"""
    supabase = get_supabase()
    response = supabase.table(table).upsert(data).execute()
    return response.data
