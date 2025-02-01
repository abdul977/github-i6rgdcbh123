import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Edit2, Eye } from 'lucide-react';

interface Collaborator {
  user_id: string;
  email?: string;
  display_name?: string;
  permission: 'view' | 'edit';
  joined_at: string;
  last_active?: string;
}

interface CollaboratorPresenceProps {
  noteId: string;
  currentUserId: string;
}

function getStatusColor(status: 'online' | 'offline' | 'idle') {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'idle': return 'bg-yellow-500';
    default: return 'bg-gray-300';
  }
}

function getRelativeTime(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString();
}

export function CollaboratorPresence({ noteId, currentUserId }: CollaboratorPresenceProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('collaborators')
          .eq('id', noteId)
          .single();

        if (error) throw error;

        const noteCollaborators = data?.collaborators || [];
        setCollaborators(noteCollaborators);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch collaborators',
          variant: 'destructive'
        });
      }
    };

    const channel = supabase.channel(`note:${noteId}`);
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeUsers = Object.keys(newState);
        setActiveCollaborators(activeUsers);
        
        // Update last_active timestamp for active users
        setCollaborators(prev => prev.map(collab => ({
          ...collab,
          last_active: activeUsers.includes(collab.user_id) ? new Date().toISOString() : collab.last_active
        })));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_id: currentUserId, 
            note_id: noteId,
            last_active: new Date().toISOString()
          });
        }
      });

    fetchCollaborators();
    const interval = setInterval(fetchCollaborators, 30000); // Refresh every 30s

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [noteId, currentUserId, toast]);

  const getCollaboratorStatus = (userId: string) => {
    const collaborator = collaborators.find(c => c.user_id === userId);
    const isActive = activeCollaborators.includes(userId);
    const lastActive = collaborator?.last_active;

    let status: 'online' | 'offline' | 'idle' = 'offline';
    if (isActive) {
      status = 'online';
    } else if (lastActive && Date.now() - new Date(lastActive).getTime() < 300000) {
      status = 'idle'; // Idle if inactive for less than 5 minutes
    }

    return {
      status,
      permission: collaborator?.permission || 'view',
      displayName: collaborator?.display_name || collaborator?.email?.split('@')[0] || userId,
      lastActive
    };
  };

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2 hover:space-x-1 transition-all duration-200">
      {collaborators.map((collaborator) => {
        const { status, permission, displayName, lastActive } = getCollaboratorStatus(collaborator.user_id);
        const isCurrentUser = collaborator.user_id === currentUserId;
        
        return (
          <TooltipProvider key={collaborator.user_id}>
            <Tooltip>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar 
                    className={`
                      border-2 transition-all duration-200 hover:scale-110
                      ${isCurrentUser ? 'border-blue-500' : status === 'online' ? 'border-green-500' : status === 'idle' ? 'border-yellow-500' : 'border-gray-300'}
                      ${permission === 'edit' ? 'ring-2 ring-purple-500' : ''}
                    `}
                  >
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.user_id}`} 
                      alt={`${displayName} (${permission})`}
                    />
                    <AvatarFallback>
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator dot */}
                  <span 
                    className={`
                      absolute bottom-0 right-0 w-3 h-3 rounded-full 
                      border-2 border-white 
                      ${getStatusColor(status)}
                    `}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3 space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  {displayName}
                  {isCurrentUser && <div className="inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">You</div>}
                </div>
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                    <span className="capitalize">{status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {permission === 'edit' ? (
                      <>
                        <Edit2 className="w-3 h-3" />
                        <span>Can edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Can view</span>
                      </>
                    )}
                  </div>
                  {lastActive && (
                    <div className="text-xs text-muted-foreground">
                      Last active: {getRelativeTime(lastActive)}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
