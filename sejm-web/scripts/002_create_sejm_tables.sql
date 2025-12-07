-- Tabele do przechowywania danych z API Sejmu
-- Uruchom ten skrypt w Supabase SQL Editor

-- Kadencje
CREATE TABLE IF NOT EXISTS terms (
  id SERIAL PRIMARY KEY,
  term_number INTEGER UNIQUE NOT NULL,
  start_date DATE,
  end_date DATE,
  current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kluby parlamentarne
CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY, -- np. "PiS", "KO"
  term_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  members_count INTEGER DEFAULT 0,
  phone TEXT,
  fax TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id, term_number)
);

-- Posłowie
CREATE TABLE IF NOT EXISTS mps (
  id INTEGER PRIMARY KEY,
  term_number INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  second_name TEXT,
  email TEXT,
  club TEXT REFERENCES clubs(id),
  active BOOLEAN DEFAULT true,
  birth_date DATE,
  birth_location TEXT,
  profession TEXT,
  education_level TEXT,
  district_name TEXT,
  district_num INTEGER,
  voivodeship TEXT,
  number_of_votes INTEGER,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Komisje sejmowe
CREATE TABLE IF NOT EXISTS committees (
  code TEXT PRIMARY KEY,
  term_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  name_genitive TEXT,
  type TEXT, -- 'standing', 'extraordinary', 'investigative'
  phone TEXT,
  composition_date DATE,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Druki sejmowe (projekty ustaw)
CREATE TABLE IF NOT EXISTS prints (
  id TEXT PRIMARY KEY, -- np. "764" 
  term_number INTEGER NOT NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  document_date DATE,
  delivery_date DATE,
  document_type TEXT, -- 'projekt ustawy', 'sprawozdanie komisji', etc.
  change_date TIMESTAMPTZ,
  process_print TEXT, -- numer druku procesu legislacyjnego
  additional_prints TEXT[], -- powiązane druki
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procesy legislacyjne
CREATE TABLE IF NOT EXISTS legislative_processes (
  id TEXT PRIMARY KEY, -- np. "10-UC-1"
  term_number INTEGER NOT NULL,
  number TEXT NOT NULL, -- druk podstawowy
  title TEXT NOT NULL,
  description TEXT, -- prosty opis
  document_type TEXT,
  project_type TEXT, -- 'government', 'deputies', 'senate', 'president', 'citizens', 'committee'
  
  -- Status
  current_stage TEXT,
  is_finished BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  is_withdrawn BOOLEAN DEFAULT false,
  
  -- Powiązania
  ue_related BOOLEAN DEFAULT false,
  principle_of_subsidiarity TEXT,
  
  -- Daty
  document_date DATE,
  change_date TIMESTAMPTZ,
  
  -- Metadane
  web_generated_date TIMESTAMPTZ,
  rcl_num TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etapy procesu legislacyjnego
CREATE TABLE IF NOT EXISTS process_stages (
  id SERIAL PRIMARY KEY,
  process_id TEXT REFERENCES legislative_processes(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_number INTEGER,
  
  -- Daty
  date DATE,
  
  -- Szczegóły etapu
  child_stages JSONB DEFAULT '[]', -- podetatpy
  decisions JSONB DEFAULT '[]', -- decyzje
  
  -- Głosowania
  sitting_num INTEGER,
  voting_numbers INTEGER[],
  
  -- Komisje
  committees TEXT[], -- kody komisji
  
  -- Teksty
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posiedzenia Sejmu
CREATE TABLE IF NOT EXISTS sittings (
  id SERIAL PRIMARY KEY,
  term_number INTEGER NOT NULL,
  sitting_number INTEGER NOT NULL,
  title TEXT,
  dates DATE[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(term_number, sitting_number)
);

-- Głosowania
CREATE TABLE IF NOT EXISTS votings (
  id SERIAL PRIMARY KEY,
  term_number INTEGER NOT NULL,
  sitting_number INTEGER NOT NULL,
  voting_number INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  
  -- Szczegóły głosowania
  topic TEXT NOT NULL,
  description TEXT,
  kind TEXT, -- 'ON_LIST', 'ELECTRONIC'
  
  -- Wyniki
  yes_count INTEGER DEFAULT 0,
  no_count INTEGER DEFAULT 0,
  abstain_count INTEGER DEFAULT 0,
  not_participating INTEGER DEFAULT 0,
  
  -- Powiązania
  print_numbers TEXT[],
  process_id TEXT REFERENCES legislative_processes(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(term_number, sitting_number, voting_number)
);

-- Głosy indywidualne posłów
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER REFERENCES votings(id) ON DELETE CASCADE,
  mp_id INTEGER REFERENCES mps(id),
  vote TEXT NOT NULL, -- 'yes', 'no', 'abstain', 'absent', 'vote_valid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voting_id, mp_id)
);

-- Głosy klubów (agregacja)
CREATE TABLE IF NOT EXISTS club_votes (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER REFERENCES votings(id) ON DELETE CASCADE,
  club_id TEXT REFERENCES clubs(id),
  yes_count INTEGER DEFAULT 0,
  no_count INTEGER DEFAULT 0,
  abstain_count INTEGER DEFAULT 0,
  not_participating INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voting_id, club_id)
);

-- Log synchronizacji
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'prints', 'processes', 'votings', 'mps', 'clubs', 'full'
  term_number INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running', -- 'running', 'success', 'error'
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_prints_term ON prints(term_number);
CREATE INDEX IF NOT EXISTS idx_prints_number ON prints(number);
CREATE INDEX IF NOT EXISTS idx_prints_document_type ON prints(document_type);
CREATE INDEX IF NOT EXISTS idx_processes_term ON legislative_processes(term_number);
CREATE INDEX IF NOT EXISTS idx_processes_stage ON legislative_processes(current_stage);
CREATE INDEX IF NOT EXISTS idx_processes_type ON legislative_processes(project_type);
CREATE INDEX IF NOT EXISTS idx_processes_finished ON legislative_processes(is_finished);
CREATE INDEX IF NOT EXISTS idx_process_stages_process ON process_stages(process_id);
CREATE INDEX IF NOT EXISTS idx_votings_date ON votings(date);
CREATE INDEX IF NOT EXISTS idx_votings_process ON votings(process_id);
CREATE INDEX IF NOT EXISTS idx_votes_mp ON votes(mp_id);
CREATE INDEX IF NOT EXISTS idx_mps_club ON mps(club);
CREATE INDEX IF NOT EXISTS idx_mps_active ON mps(active);

-- RLS Policies
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mps ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE prints ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislative_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sittings ENABLE ROW LEVEL SECURITY;
ALTER TABLE votings ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Publiczny odczyt dla danych parlamentarnych
CREATE POLICY "Public read access" ON terms FOR SELECT USING (true);
CREATE POLICY "Public read access" ON clubs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON mps FOR SELECT USING (true);
CREATE POLICY "Public read access" ON committees FOR SELECT USING (true);
CREATE POLICY "Public read access" ON prints FOR SELECT USING (true);
CREATE POLICY "Public read access" ON legislative_processes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON process_stages FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sittings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON votings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON votes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON club_votes FOR SELECT USING (true);

-- Sync logs tylko dla service role
CREATE POLICY "Service role only" ON sync_logs FOR ALL USING (false);

-- Funkcja aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery updated_at
CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON terms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_mps_updated_at BEFORE UPDATE ON mps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prints_updated_at BEFORE UPDATE ON prints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON legislative_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON process_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sittings_updated_at BEFORE UPDATE ON sittings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_votings_updated_at BEFORE UPDATE ON votings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
