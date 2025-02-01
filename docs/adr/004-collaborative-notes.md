# 004. Collaborative Note System Architecture

## Status
Accepted

## Context
Users need to collaborate on notes with:
- Real-time co-editing and presence tracking
- Granular access control (view/edit permissions)
- Secure invitation workflow
- Version history and contributor attribution

## Decision
Implement a hybrid CRDT/OT system using:

1. **Data Model Enhancements**
```typescript
// Updated Note type
interface Note {
  collaborators: Array<{
    user_id: string
    permission: 'view'|'edit'
    joined_at: string
    last_active?: string
    status: 'online'|'offline'
  }>
  invitations: Array<{
    email: string
    token: string
    permission: 'view'|'edit'
    expires_at: string
  }>
  content_versions: Array<{
    content: string
    author: string
    timestamp: string
  }>
  sharing_token?: string
}
```

2. **Real-time Infrastructure**
- Supabase Realtime for presence and metadata
- Operational Transform for text collaboration
- Dedicated presence channel per note with:
  - Heartbeat updates every 30s
  - Last_active timestamp tracking
  - Presence sync event listeners
- WebSocket-based invitation service
- Presence expiration after 5 minutes inactivity

3. **Security Model**
- Row-level security policies for:
  - Owner: Full CRUD access
  - Collaborators:
    - Edit: Update content/metadata
    - View: Read-only access
  - Token-based:
    - Read-only unless token has edit rights
    - Single-use token expiration

4. **UI Components**
- HoverableAvatars:
  - Tooltip shows name, permission, status
  - Context menu for permission changes (owners only)
- DynamicCollaboratorList:
  - Auto-updates via presence channel
  - Color-coded online status indicators
- ShareButton:
  - Modal with email input and permission selector
  - Integration with invitation service
- PermissionAwareUI:
  - Disables editing controls for view-only
  - Hides sensitive actions based on role
- NoteSecurityWrapper:
  - Handles permission propagation
  - Renders appropriate editor/viewer
- RealTimePresenceIndicator:
  - Shows collaborator avatars
  - Updates status in real-time
- VersionHistoryPanel:
  - Tracks content changes with attribution

## Implementation Sequence
1. Database schema migration for status tracking
2. Presence service implementation
3. Security policy enhancements
4. UI component development
5. End-to-end testing with permission scenarios