/*
  # Fix Permissions and Queries

  1. Changes
    - Fix collaborators query syntax
    - Add proper RLS policies for invitations
    - Grant necessary permissions
    - Add helper functions for collaborator checks

  2. Security
    - Update RLS policies to be more secure
    - Add proper permission checks
*/

-- Create a function to check if a user is a collaborator
CREATE OR REPLACE FUNCTION is_collaborator(note_id uuid, user_id uuid, required_permission text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM notes n,
         jsonb_array_elements(n.collaborators) AS c
    WHERE n.id = note_id
    AND c->>'user_id' = user_id::text
    AND (required_permission IS NULL OR c->>'permission' = required_permission)
  );
END;
$$;

-- Update notes policies to use the helper function
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_collaborator(id, auth.uid())
  );

-- Update note_entries policies
DROP POLICY IF EXISTS "Users can view note entries" ON note_entries;
CREATE POLICY "Users can view note entries"
  ON note_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR is_collaborator(id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update note entries" ON note_entries;
CREATE POLICY "Users can update note entries"
  ON note_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR is_collaborator(id, auth.uid(), 'edit'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR is_collaborator(id, auth.uid(), 'edit'))
    )
  );

-- Update invitations policies
DROP POLICY IF EXISTS "Users can view invitations" ON invitations;
CREATE POLICY "Users can view invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 
      FROM notes 
      WHERE id = note_id 
      AND user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_collaborators ON notes USING gin (collaborators);