import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Invitation {
  id: string;
  noteId: string;
  email: string;
  permission: 'view' | 'edit';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

interface CollaborativeNote {
  id: string;
  title: string;
  permission: 'view' | 'edit';
  ownerId: string;
  lastActive: string;
}

export function useCollaborations() {
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [sharedNotes, setSharedNotes] = useState<CollaborativeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInvitations = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data: invites, error } = await supabase
        .from('invitations')
        .select('id, note_id, email, permission, invited_by, expires_at, created_at')
        .eq('email', user.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      setPendingInvites(
        invites.map(invite => ({
          id: invite.id,
          noteId: invite.note_id,
          email: invite.email,
          permission: invite.permission,
          invitedBy: invite.invited_by,
          expiresAt: invite.expires_at,
          createdAt: invite.created_at
        }))
      );
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invitations',
        variant: 'destructive'
      });
    }
  }, [user?.email, toast]);

  const fetchSharedNotes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, user_id, collaborators, last_active_collaborators, updated_at')
        .or(`user_id.eq.${user.id},collaborators.cs.{"user_id":"${user.id}"}`);

      if (error) throw error;

      setSharedNotes(
        notes.map(note => {
          const collaborator = note.collaborators?.find(
            (c: any) => c.user_id === user.id
          );
          return {
            id: note.id,
            title: note.title,
            permission: collaborator?.permission || 'view',
            ownerId: note.user_id,
            lastActive: note.last_active_collaborators?.[user.id] || note.updated_at
          };
        })
      );
    } catch (error) {
      console.error('Error fetching shared notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch shared notes',
        variant: 'destructive'
      });
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchInvitations(), fetchSharedNotes()]);
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const invitesChannel = supabase.channel('invitations_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `email=eq.${user.email}`
        },
        () => fetchInvitations()
      )
      .subscribe();

    const notesChannel = supabase.channel('shared_notes_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `collaborators::jsonb @> '[{"user_id":"${user.id}"}]'::jsonb`
        },
        () => fetchSharedNotes()
      )
      .subscribe();

    // Subscribe to collaborator status changes
    const presenceChannel = supabase.channel('collaborators_presence');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<CollaboratorStatus>();
        // Update collaborator statuses in shared notes
        setSharedNotes(currentNotes =>
          currentNotes.map(note => {
            const presence = state[note.ownerId]?.[0]; // Get first presence entry for owner
            return {
              ...note,
              lastActive: presence?.last_seen || note.lastActive
            };
          })
        );
      })
      .subscribe();

    return () => {
      invitesChannel.unsubscribe();
      notesChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [user?.id, user?.email, fetchInvitations, fetchSharedNotes]);

  const acceptInvitation = async (invitationId: string) => {
    if (!user?.id) return;
    
    try {
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;
      
      // Call the accept_invitation stored procedure
      const { error: rpcError } = await supabase.rpc('accept_invitation', {
        invitation_id: invitationId,
        user_id: user.id
      });

      if (rpcError) {
        // Check for specific error types
        if (rpcError.message.includes('already accepted')) {
          throw new Error('This invitation has already been accepted');
        } else if (rpcError.message.includes('expired')) {
          throw new Error('This invitation has expired');
        }
        throw rpcError;
      }

      toast({
        title: 'Success',
        description: 'You now have access to the shared note',
      });

      // Refresh data
      await Promise.all([fetchInvitations(), fetchSharedNotes()]);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive'
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation declined',
      });

      setPendingInvites(current => 
        current.filter(invite => invite.id !== invitationId)
      );
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive'
      });
    }
  };

  return {
    pendingInvites,
    sharedNotes,
    loading,
    acceptInvitation,
    declineInvitation,
    refreshData: useCallback(() => {
      return Promise.all([fetchInvitations(), fetchSharedNotes()]);
    }, [fetchInvitations, fetchSharedNotes])
  };
}