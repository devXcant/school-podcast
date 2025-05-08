-- Add livestream fields to podcasts table
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS live_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for faster livestream queries
CREATE INDEX IF NOT EXISTS idx_podcasts_is_live ON podcasts(is_live);

-- Add RLS policies for livestream
CREATE POLICY "Enable read access for all authenticated users on live podcasts"
ON podcasts FOR SELECT
TO authenticated
USING (is_live = true);

CREATE POLICY "Enable update for lecturers on their own live podcasts"
ON podcasts FOR UPDATE
TO authenticated
USING (
  is_live = true AND
  recorded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'lecturer'
  )
)
WITH CHECK (
  is_live = true AND
  recorded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'lecturer'
  )
);
