-- Fix Critical RLS Policies on shared_results table

-- 1. Drop the UPDATE policy (edge function uses service role key)
DROP POLICY IF EXISTS "Anyone can update view count" ON shared_results;

-- 2. Replace SELECT policy with expiration enforcement
DROP POLICY IF EXISTS "Anyone can view shared results" ON shared_results;

CREATE POLICY "View non-expired shared results" 
ON shared_results 
FOR SELECT 
USING (expires_at IS NULL OR expires_at > now());

-- 3. Drop the INSERT policy (edge function uses service role key)
DROP POLICY IF EXISTS "Anyone can create shared results" ON shared_results;