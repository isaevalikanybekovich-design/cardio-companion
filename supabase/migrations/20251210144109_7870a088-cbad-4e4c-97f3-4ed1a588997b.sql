-- Create table for reference medical threshold values
CREATE TABLE public.reference_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value_min NUMERIC,
  value_max NUMERIC,
  unit TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own reference data"
ON public.reference_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reference data"
ON public.reference_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reference data"
ON public.reference_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reference data"
ON public.reference_data
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_reference_data_updated_at
BEFORE UPDATE ON public.reference_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default reference values (these will be user-specific when inserted by the user)
-- Users will add their own via the UI