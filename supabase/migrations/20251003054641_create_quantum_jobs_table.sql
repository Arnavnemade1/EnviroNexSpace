/*
  # Create quantum jobs tracking table

  1. New Tables
    - `quantum_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references auth.users)
      - `job_id` (text, IBM Quantum job ID)
      - `status` (text, job status: queued, running, completed, failed, timeout)
      - `backend` (text, quantum backend used)
      - `features` (jsonb, input features array)
      - `qubits` (int, number of qubits)
      - `shots` (int, number of shots)
      - `result` (jsonb, nullable, job results)
      - `error` (text, nullable, error message)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `execution_time_ms` (int, nullable)

  2. Security
    - Enable RLS on `quantum_jobs` table
    - Add policy for users to read their own jobs
    - Add policy for users to create jobs
    - Add policy for service role to update job status

  3. Indexes
    - Index on `user_id` for user job queries
    - Index on `job_id` for IBM job ID lookups
    - Index on `status` for filtering by status
    - Index on `created_at` for chronological queries
*/

CREATE TABLE IF NOT EXISTS quantum_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id text,
  status text NOT NULL DEFAULT 'queued',
  backend text NOT NULL DEFAULT 'unknown',
  features jsonb NOT NULL,
  qubits int NOT NULL DEFAULT 5,
  shots int NOT NULL DEFAULT 1024,
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  execution_time_ms int,
  
  CONSTRAINT valid_status CHECK (status IN ('queued', 'running', 'completed', 'failed', 'timeout', 'fallback'))
);

ALTER TABLE quantum_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quantum_jobs_user_id ON quantum_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_quantum_jobs_job_id ON quantum_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_quantum_jobs_status ON quantum_jobs(status);
CREATE INDEX IF NOT EXISTS idx_quantum_jobs_created_at ON quantum_jobs(created_at DESC);

CREATE POLICY "Users can view their own quantum jobs"
  ON quantum_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quantum jobs"
  ON quantum_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update quantum jobs"
  ON quantum_jobs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert quantum jobs"
  ON quantum_jobs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
