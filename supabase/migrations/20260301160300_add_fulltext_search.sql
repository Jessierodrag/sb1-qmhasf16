-- Add a tsvector column for full text search on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update the search vector
CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('french', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.name, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(NEW.prestations, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS profiles_search_update ON profiles;
CREATE TRIGGER profiles_search_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_search_vector_update();

-- Update existing rows
UPDATE profiles SET search_vector = 
  setweight(to_tsvector('french', coalesce(username, '')), 'A') ||
  setweight(to_tsvector('french', coalesce(name, '')), 'B') ||
  setweight(to_tsvector('french', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('french', coalesce(description, '')), 'C') ||
  setweight(to_tsvector('french', coalesce(prestations, '')), 'C');

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(search_vector);

-- Create RPC function for search
CREATE OR REPLACE FUNCTION search_profiles(query text, max_results int DEFAULT 20)
RETURNS TABLE(
  id uuid, user_id uuid, username text, name text, location text, 
  description text, photos text[], rating numeric, 
  prestations text, physical_info jsonb, personal_info jsonb,
  subscription_tier text, rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.user_id, p.username, p.name, p.location,
    p.description, p.photos, p.rating,
    p.prestations, p.physical_info, p.personal_info,
    p.subscription_tier,
    ts_rank(p.search_vector, websearch_to_tsquery('french', query)) as rank
  FROM profiles p
  WHERE p.search_vector @@ websearch_to_tsquery('french', query)
    AND p.is_active = true
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
