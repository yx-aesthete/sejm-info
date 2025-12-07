-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  favorite_categories TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Watched laws (bookmarked by users)
CREATE TABLE IF NOT EXISTS public.watched_laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  druk_id TEXT NOT NULL,
  druk_number TEXT NOT NULL,
  title TEXT NOT NULL,
  notify_on_stage_change BOOLEAN DEFAULT TRUE,
  notify_on_vote BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, druk_id)
);

ALTER TABLE public.watched_laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watched_laws_select_own" ON public.watched_laws FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watched_laws_insert_own" ON public.watched_laws FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watched_laws_update_own" ON public.watched_laws FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "watched_laws_delete_own" ON public.watched_laws FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stage_change', 'vote', 'comment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  druk_id TEXT,
  druk_number TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Law popularity tracking (public, no RLS needed for reads)
CREATE TABLE IF NOT EXISTS public.law_stats (
  druk_id TEXT PRIMARY KEY,
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.law_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "law_stats_select_all" ON public.law_stats FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "law_stats_insert_authenticated" ON public.law_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "law_stats_update_authenticated" ON public.law_stats FOR UPDATE TO authenticated USING (true);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
