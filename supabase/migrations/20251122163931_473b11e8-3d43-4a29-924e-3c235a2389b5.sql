-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create patients table for medical questionnaire data
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm INTEGER NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  current_complaints TEXT[] DEFAULT '{}',
  complaints_details TEXT,
  medical_history TEXT,
  risk_factors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patient data"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patient data"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patient data"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id);

-- Create ecg_scans table
CREATE TABLE public.ecg_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  pm_cardio_result JSONB,
  gemini_result JSONB,
  final_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ecg_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ECG scans"
  ON public.ecg_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ECG scans"
  ON public.ecg_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ECG scans"
  ON public.ecg_scans FOR UPDATE
  USING (auth.uid() = user_id);

-- Create medical_reports table
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecg_scan_id UUID NOT NULL REFERENCES public.ecg_scans(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('normal', 'attention', 'urgent')),
  recommendations TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical reports"
  ON public.medical_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical reports"
  ON public.medical_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create voice_consultations table for voice assistant history
CREATE TABLE public.voice_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.voice_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations"
  ON public.voice_consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consultations"
  ON public.voice_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for ECG files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ecg-files', 'ecg-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ECG files
CREATE POLICY "Users can upload own ECG files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ecg-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own ECG files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ecg-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own ECG files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ecg-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own ECG files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ecg-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );