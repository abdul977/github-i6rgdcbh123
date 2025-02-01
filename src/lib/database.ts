import { supabase } from '@/integrations/supabase/client';
import { Note, NoteEntry } from '@/types/note';

export const createNote = async (note: Omit<Note, 'id' | 'created_at'>): Promise<{ data: Note | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: note.title,
        collaborators: note.collaborators || []
      }])
      .select()
      .single();

    if (error) throw error;

    // Create note entries
    if (note.entries.length > 0) {
      const entries = note.entries.map((entry, index) => ({
        note_id: data.id,
        content: entry.content,
        audio_url: entry.audio_url,
        entry_order: index
      }));

      const { error: entriesError } = await supabase
        .from('note_entries')
        .insert(entries);

      if (entriesError) throw entriesError;
    }

    return { data: data as Note, error: null };
  } catch (error) {
    console.error('Error creating note:', error);
    return { data: null, error: error as Error };
  }
};

export const updateNote = async (note: Note): Promise<{ error: Error | null }> => {
  try {
    // Update note
    const { error: noteError } = await supabase
      .from('notes')
      .update({
        title: note.title,
        collaborators: note.collaborators,
        updated_at: new Date().toISOString()
      })
      .eq('id', note.id);

    if (noteError) throw noteError;

    // Delete existing entries
    const { error: deleteError } = await supabase
      .from('note_entries')
      .delete()
      .eq('note_id', note.id);

    if (deleteError) throw deleteError;

    // Insert new entries
    if (note.entries.length > 0) {
      const entries = note.entries.map((entry, index) => ({
        note_id: note.id,
        content: entry.content,
        audio_url: entry.audio_url,
        entry_order: index
      }));

      const { error: entriesError } = await supabase
        .from('note_entries')
        .insert(entries);

      if (entriesError) throw entriesError;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating note:', error);
    return { error: error as Error };
  }
};

export const deleteNote = async (noteId: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { error: error as Error };
  }
};

export const subscribeToNotes = (
  userId: string,
  onUpdate: (note: Note) => void
) => {
  const channel = supabase
    .channel('notes_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onUpdate(payload.new as Note);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToCollaboration = (
  noteId: string,
  onCollaboratorUpdate: (collaborators: any[]) => void
) => {
  const channel = supabase
    .channel(`note_${noteId}`)
    .on(
      'presence',
      { event: 'sync' },
      () => {
        const state = channel.presenceState();
        onCollaboratorUpdate(Object.values(state));
      }
    )
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};