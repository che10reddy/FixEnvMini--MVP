-- Create shared_results table for storing shareable analysis results
CREATE TABLE public.shared_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  analysis_data JSONB NOT NULL,
  repository_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index on share_token for fast lookups
CREATE INDEX idx_shared_results_token ON public.shared_results(share_token);

-- Create index on created_at for cleanup queries
CREATE INDEX idx_shared_results_created_at ON public.shared_results(created_at);

-- Enable Row Level Security
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared results (public view)
CREATE POLICY "Anyone can view shared results"
ON public.shared_results
FOR SELECT
USING (true);

-- Allow anyone to insert shared results (no auth required for sharing)
CREATE POLICY "Anyone can create shared results"
ON public.shared_results
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update view count
CREATE POLICY "Anyone can update view count"
ON public.shared_results
FOR UPDATE
USING (true)
WITH CHECK (true);