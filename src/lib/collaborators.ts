import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface Collaborator {
  user_id: string;
  email?: string;
  display_name?: string;
  permission: 'view' | 'edit';
  joined_at: string;
}

export async function inviteCollaborator(
  noteId: string,
  collaborator: { email: string; permission: 'view' | 'edit' }
): Promise<boolean> {
  try {
    // Check if an invitation already exists
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('note_id', noteId)
      .eq('email', collaborator.email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      console.error('Active invitation already exists');
      return false;
    }

    // Check if user is already a collaborator
    const { data: note } = await supabase
      .from('notes')
      .select('collaborators')
      .eq('id', noteId)
      .single();

    const existingCollaborators = note?.collaborators || [];
    const alreadyCollaborator = existingCollaborators.some(
      (c: any) => c.email?.toLowerCase() === collaborator.email.toLowerCase()
    );

    if (alreadyCollaborator) {
      console.error('User is already a collaborator');
      return false;
    }

    // Create new invitation with 7 day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        note_id: noteId,
        email: collaborator.email.toLowerCase(),
        permission: collaborator.permission,
        token: crypto.randomUUID(),
        expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return false;
  }
}

export async function generateShareLink(
  noteId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Generate a unique token
    const token = crypto.randomUUID();

    // Update the note with the sharing token
    const { error: updateError } = await supabase
      .from('notes')
      .update({ sharing_token: token })
      .eq('id', noteId);

    if (updateError) throw updateError;

    // Generate the share URL
    const shareUrl = `${window.location.origin}/share/${noteId}?token=${token}`;
    
    return { url: shareUrl, error: null };
  } catch (error) {
    console.error('Error generating share link:', error);
    return { url: null, error: error as Error };
  }
}

export async function validateShareToken(
  noteId: string,
  token: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('sharing_token')
      .eq('id', noteId)
      .single();

    if (error) throw error;

    return data.sharing_token === token;
  } catch (error) {
    console.error('Error validating share token:', error);
    return false;
  }
}

export async function removeCollaborator(
  noteId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('collaborators, user_id')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return false;
    }

    // Only allow note owner or the collaborator themselves to remove
    const { data: currentUser } = await supabase.auth.getUser();
    if (note.user_id !== currentUser?.user?.id && currentUser?.user?.id !== userId) {
      console.error('Not authorized to remove collaborator');
      return false;
    }

    const existingCollaborators = note.collaborators || [];
    const updatedCollaborators = existingCollaborators.filter(
      (c: any) => c.user_id !== userId
    );

    // Remove collaborator from note
    const { error: updateError } = await supabase
      .from('notes')
      .update({
        collaborators: updatedCollaborators,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (updateError) {
      console.error('Error updating note:', updateError);
      return false;
    }

    // Delete any pending invitations for this user
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('note_id', noteId)
      .eq('email', (
        await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()
      ).data?.email);

    if (deleteError) {
      console.error('Error deleting invitations:', deleteError);
      // Don't return false here as the main operation succeeded
    }

    return true;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
}

export async function updateCollaboratorPermission(
  noteId: string,
  userId: string,
  permission: 'view' | 'edit'
): Promise<boolean> {
  try {
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('collaborators, user_id')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return false;
    }

    // Only note owner can update permissions
    const { data: currentUser } = await supabase.auth.getUser();
    if (note.user_id !== currentUser?.user?.id) {
      console.error('Not authorized to update permissions');
      return false;
    }

    const existingCollaborators = note.collaborators || [];
    const collaboratorIndex = existingCollaborators.findIndex(
      (c: any) => c.user_id === userId
    );

    if (collaboratorIndex === -1) {
      console.error('Collaborator not found');
      return false;
    }

    // Update collaborator's permission
    existingCollaborators[collaboratorIndex] = {
      ...existingCollaborators[collaboratorIndex],
      permission,
      updated_at: new Date().toISOString()
    };

    // Update note with new collaborators array
    const { error: updateError } = await supabase
      .from('notes')
      .update({
        collaborators: existingCollaborators,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (updateError) {
      console.error('Error updating note:', updateError);
      return false;
    }

    // Update any pending invitations for this user
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({ permission })
      .eq('note_id', noteId)
      .eq('email', (
        await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()
      ).data?.email)
      .is('accepted_at', null);

    if (inviteError) {
      console.error('Error updating invitations:', inviteError);
      // Don't return false as main operation succeeded
    }

    return true;
  } catch (error) {
    console.error('Error updating collaborator permission:', error);
    return false;
  }
}
