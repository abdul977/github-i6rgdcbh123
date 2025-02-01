export interface NoteEntry {
  id?: string;
  content: string;
  audio_url?: string;
  audioTranscription?: string;
  entry_order?: number;
  created_at?: string;
}

export enum ProcessingVariant {
  ACTIONABLE = 'actionable',
  SUMMARY = 'summary',
  REASONING = 'reasoning',
  GRAMMAR = 'grammar'
}

export interface Collaborator {
  user_id: string;
  permission: 'view' | 'edit';
  joined_at: string;
  last_active?: string;
}

export interface ContentVersion {
  content: string;
  author: string;
  timestamp: string;
}

export interface Note {
  id?: string;
  title: string;
  entries: NoteEntry[];
  processingType: ProcessingVariant;
  created_at?: string;
  collaborators: Collaborator[];
  content_versions: ContentVersion[];
  sharing_token?: string;
  updated_at?: string;
}