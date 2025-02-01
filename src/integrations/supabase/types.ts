export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string
          note_id: string
          email: string
          token: string
          permission: 'view' | 'edit'
          invited_by: string
          expires_at: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          note_id: string
          email: string
          token: string
          permission: 'view' | 'edit'
          invited_by: string
          expires_at: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          note_id?: string
          email?: string
          token?: string
          permission?: 'view' | 'edit'
          invited_by?: string
          expires_at?: string
          created_at?: string
          accepted_at?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          user_id: string
          created_at: string
          updated_at: string
          collaborators: Json
          content_versions: Json
          last_active_collaborators: Json
          sharing_token?: string
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          created_at?: string
          updated_at?: string
          collaborators?: Json
          content_versions?: Json
          last_active_collaborators?: Json
          sharing_token?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          collaborators?: Json
          content_versions?: Json
          last_active_collaborators?: Json
          sharing_token?: string
        }
      }
      note_entries: {
        Row: {
          id: string
          note_id: string
          content: string
          audio_url: string | null
          entry_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          note_id: string
          content: string
          audio_url?: string | null
          entry_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          content?: string
          audio_url?: string | null
          entry_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: {
          invitation_id: string
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      permission_level: 'view' | 'edit'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]
