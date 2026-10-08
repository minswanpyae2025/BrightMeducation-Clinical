-- ==============================================================================
-- OSCE LIVE CLINICAL - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 100, -- Free 100 credits on signup (5 stations)
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Stations Table (Supports dynamic JSONB templates)
CREATE TABLE IF NOT EXISTS public.stations (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('history_taking', 'physical_examination')),
  subcategory TEXT NOT NULL CHECK (subcategory IN ('cvs', 'respi', 'abdomen', 'cns')),
  title TEXT NOT NULL,
  title_my TEXT,
  subtitle TEXT,
  subtitle_my TEXT,
  patient_name TEXT NOT NULL,
  patient_name_my TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_occupation TEXT,
  patient_occupation_my TEXT,
  patient_appearance TEXT,
  patient_appearance_my TEXT,
  chief_complaint TEXT NOT NULL,
  chief_complaint_my TEXT,
  default_gesture TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 20, -- 20 credits per station attempt
  duration_minutes INTEGER NOT NULL DEFAULT 8,
  candidate_brief JSONB,
  vitals JSONB,
  script_triggers JSONB,
  physical_exam_systems JSONB,
  rubric JSONB,
  model_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available stations"
  ON public.stations FOR SELECT
  TO authenticated, anon
  USING (true);

-- 4. Station Attempts & Exam Results Table
CREATE TABLE IF NOT EXISTS public.station_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  station_id TEXT REFERENCES public.stations(id),
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  score_percentage INTEGER NOT NULL,
  rubric_completed INTEGER NOT NULL,
  rubric_total INTEGER NOT NULL,
  credits_deducted INTEGER NOT NULL DEFAULT 20,
  transcript JSONB,
  feedback_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.station_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON public.station_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON public.station_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Credit Transactions Audit Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negative for deduction (e.g. -20), positive for refill (+100)
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit history"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Atomic Function to Deduct Station Credits (20 Credits)
CREATE OR REPLACE FUNCTION public.deduct_station_credits(
  user_uuid UUID,
  station_identifier TEXT,
  cost INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current user credits with row lock
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_uuid
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF current_credits < cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits. Each station requires ' || cost || ' credits.',
      'current_credits', current_credits
    );
  END IF;

  new_balance := current_credits - cost;

  -- Deduct credits
  UPDATE public.profiles
  SET credits = new_balance,
      updated_at = timezone('utc'::text, now())
  WHERE id = user_uuid;

  -- Record transaction audit
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, description)
  VALUES (
    user_uuid,
    -cost,
    new_balance,
    'OSCE Station Attempt: ' || station_identifier
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'deducted', cost
  );
END;
$$;

-- 7. Trigger to automatically create a profile with 100 free credits when a user signs up (via Google or Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    100 -- Starting bonus credits (5 stations)
  );

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, description)
  VALUES (
    NEW.id,
    100,
    100,
    'Welcome bonus credits'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Default Stations
INSERT INTO public.stations (id, category, subcategory, title, patient_name, patient_age, patient_gender, chief_complaint, credits_cost, duration_minutes)
VALUES
  ('hist-cvs-chest-pain', 'history_taking', 'cvs', 'Acute Chest Pain - Suspected ACS', 'Arthur Pendelton', 58, 'male', 'Crushing central chest pain radiating to left arm', 20, 8),
  ('hist-respi-asthma', 'history_taking', 'respi', 'Acute Severe Asthma Exacerbation', 'Chloe Bennett', 26, 'female', 'Sudden shortness of breath and wheezing', 20, 8),
  ('hist-abdo-pancreatitis', 'history_taking', 'abdomen', 'Epigastric Pain - Acute Pancreatitis', 'David Miller', 49, 'male', 'Severe constant boring epigastric pain shooting to back', 20, 8),
  ('hist-cns-headache', 'history_taking', 'cns', 'Thunderclap Headache - Red Flags', 'Michael Ross', 42, 'male', 'Sudden catastrophic headache like a baseball bat', 20, 8),
  ('exam-cvs-murmur', 'physical_examination', 'cvs', 'Focused Cardiovascular Examination', 'Robert Evans', 63, 'male', 'Heart auscultation, murmurs, carotid pulse & JVP', 20, 8),
  ('exam-respi-chest', 'physical_examination', 'respi', 'Focused Respiratory Examination', 'Sarah Jenkins', 52, 'female', 'Chest expansion, percussion, crackles & wheezes', 20, 8),
  ('exam-abdo-quadrants', 'physical_examination', 'abdomen', 'Focused Abdominal Examination', 'James Taylor', 52, 'male', 'Palpation, guarding, peritonitis signs & bowel sounds', 20, 8),
  ('exam-cns-neuro', 'physical_examination', 'cns', 'Focused Neurological Examination', 'Elena Rostova', 38, 'female', 'Cranial nerves, motor tone, power & reflexes', 20, 8)
ON CONFLICT (id) DO NOTHING;
