/*
  # Create Notes Schema
  
  1. New Tables
    - notes
      - id (uuid, primary key)
      - title (text)
      - user_id (uuid, references auth.users)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - collaborators (jsonb)
      - content_versions (jsonb)
      - last_active_collaborators (jsonb)
      - sharing_token (text)
    
    - note_entries
      - id (uuid, primary key)
      - note_id (uuid, references notes)
      - content (text)
      - audio_url (text)
      - entry_order (integer)
      - created_at (timestamptz)
      - updated_at (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  collaborators jsonb DEFAULT '[]',
  content_versions jsonb DEFAULT '[]',
  last_active_collaborators jsonb DEFAULT '{}',
  sharing_token text
);

-- Create note_entries table with foreign key relationship
CREATE TABLE IF NOT EXISTS note_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  content text,
  audio_url text,
  entry_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for notes table
CREATE POLICY "Users can create notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    collaborators::jsonb @> format('[{"user_id": "%s"}]', auth.uid())::jsonb
  );

CREATE POLICY "Users can update their own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for note_entries table
CREATE POLICY "Users can create note entries"
  ON note_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR collaborators::jsonb @> format('[{"user_id": "%s", "permission": "edit"}]', auth.uid())::jsonb)
    )
  );

CREATE POLICY "Users can view note entries"
  ON note_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR collaborators::jsonb @> format('[{"user_id": "%s"}]', auth.uid())::jsonb)
    )
  );

CREATE POLICY "Users can update note entries"
  ON note_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR collaborators::jsonb @> format('[{"user_id": "%s", "permission": "edit"}]', auth.uid())::jsonb)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR collaborators::jsonb @> format('[{"user_id": "%s", "permission": "edit"}]', auth.uid())::jsonb)
    )
  );

CREATE POLICY "Users can delete note entries"
  ON note_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND (user_id = auth.uid() OR collaborators::jsonb @> format('[{"user_id": "%s", "permission": "edit"}]', auth.uid())::jsonb)
    )
  );

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  invited_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Enable RLS for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can create invitations for their notes"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM notes 
      WHERE id = note_id 
      AND user_id = auth.uid()
    )
  );

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(invitation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_id uuid;
  v_permission text;
  v_email text;
BEGIN
  -- Get invitation details
  SELECT note_id, permission, email INTO v_note_id, v_permission, v_email
  FROM invitations
  WHERE id = invitation_id
    AND accepted_at IS NULL
    AND expires_at > now();

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Check if user email matches invitation
  IF v_email != (SELECT email FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  -- Update note collaborators
  UPDATE notes
  SET collaborators = COALESCE(collaborators, '[]'::jsonb) || 
    jsonb_build_object(
      'user_id', user_id,
      'permission', v_permission,
      'joined_at', now()
    )::jsonb
  WHERE id = v_note_id;

  -- Mark invitation as accepted
  UPDATE invitations
  SET accepted_at = now()
  WHERE id = invitation_id;

  RETURN true;
END;
$$;