-- =====================================================
-- Lublin Explorer – schemat bazy danych Supabase
-- Uruchom w: Supabase Dashboard > SQL Editor
-- Skrypt jest idempotentny – można uruchamiać wielokrotnie.
-- =====================================================

-- Atrakcje turystyczne (importowane z OSM/Wikipedia)
CREATE TABLE IF NOT EXISTS attractions (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  location      TEXT,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  category      TEXT        NOT NULL,
  year_built    TEXT,
  architect     TEXT,
  opening_hours TEXT,
  price         TEXT,
  image_url     TEXT,
  wikipedia_url TEXT,
  has_ar        BOOLEAN     DEFAULT false,
  has_audio     BOOLEAN     DEFAULT false,
  has_ai        BOOLEAN     DEFAULT true,
  source        TEXT,
  source_id     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions (category);

ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_attractions" ON attractions;
CREATE POLICY "public_read_attractions" ON attractions
  FOR SELECT USING (true);

-- W MVP otwarte zapisy (do seedingu z anon key). W produkcji ogranicz do service_role.
DROP POLICY IF EXISTS "anon_write_attractions" ON attractions;
CREATE POLICY "anon_write_attractions" ON attractions
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Ciekawostki (1 atrakcja → wiele faktów)
-- =====================================================
CREATE TABLE IF NOT EXISTS fun_facts (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  attraction_id TEXT    NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  content       TEXT    NOT NULL,
  order_idx     INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fun_facts_attraction ON fun_facts (attraction_id);

ALTER TABLE fun_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_fun_facts" ON fun_facts;
CREATE POLICY "public_read_fun_facts" ON fun_facts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_write_fun_facts" ON fun_facts;
CREATE POLICY "anon_write_fun_facts" ON fun_facts
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Ulubione atrakcje (per urządzenie, bez wymaganego logowania)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id     TEXT        NOT NULL,
  attraction_id TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT favorites_unique UNIQUE (device_id, attraction_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_device_id     ON favorites (device_id);
CREATE INDEX IF NOT EXISTS idx_favorites_attraction_id ON favorites (attraction_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_favorites" ON favorites;
CREATE POLICY "allow_all_favorites" ON favorites
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Statystyki atrakcji (licznik wyświetleń i ulubionych)
-- =====================================================
CREATE TABLE IF NOT EXISTS attraction_stats (
  attraction_id  TEXT    PRIMARY KEY,
  view_count     INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attraction_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_stats" ON attraction_stats;
CREATE POLICY "public_read_stats" ON attraction_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_stats" ON attraction_stats;
CREATE POLICY "allow_update_stats" ON attraction_stats
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Funkcja: automatyczna aktualizacja favorite_count
-- =====================================================
CREATE OR REPLACE FUNCTION sync_favorite_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO attraction_stats (attraction_id, favorite_count)
      VALUES (NEW.attraction_id, 1)
      ON CONFLICT (attraction_id)
      DO UPDATE SET
        favorite_count = attraction_stats.favorite_count + 1,
        updated_at     = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE attraction_stats
       SET favorite_count = GREATEST(favorite_count - 1, 0),
           updated_at     = NOW()
     WHERE attraction_id = OLD.attraction_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_favorite_count ON favorites;
CREATE TRIGGER trg_sync_favorite_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW EXECUTE FUNCTION sync_favorite_count();
