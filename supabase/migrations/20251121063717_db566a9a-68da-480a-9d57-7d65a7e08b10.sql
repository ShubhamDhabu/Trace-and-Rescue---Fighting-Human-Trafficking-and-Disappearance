-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  branch_department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create cases table for missing persons
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  description TEXT,
  photo_url TEXT,
  date_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_location TEXT,
  last_seen_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  branch_department TEXT,
  contact_info TEXT,
  additional_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Cases policies - users can see their own cases and all public cases
CREATE POLICY "Users can view own cases"
  ON public.cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public cases"
  ON public.cases FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases"
  ON public.cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases"
  ON public.cases FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cases table
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for case photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-photos', 'case-photos', true);

-- Storage policies for case photos
CREATE POLICY "Anyone can view case photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'case-photos');

CREATE POLICY "Authenticated users can upload case photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'case-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their case photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'case-photos' AND auth.role() = 'authenticated');

-- Create storage bucket for CCTV footage
INSERT INTO storage.buckets (id, name, public)
VALUES ('cctv-footage', 'cctv-footage', false);

-- Storage policies for CCTV footage
CREATE POLICY "Users can view their CCTV footage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cctv-footage' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload CCTV footage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cctv-footage' AND auth.role() = 'authenticated');