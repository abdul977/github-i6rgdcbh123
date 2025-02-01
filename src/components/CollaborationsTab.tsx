import { useState } from 'react';
import { useCollaborations } from '@/hooks/use-collaborations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';

export function CollaborationsTab() {
  const { pendingInvites, sharedNotes, loading, acceptInvitation, declineInvitation } = useCollaborations();
  const [activeTab, setActiveTab] = useState<string>('shared');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const PermissionBadge = ({ permission }: { permission: 'view' | 'edit' }) => (
    <div className={`
      inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold
      ${permission === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
    `}>
      {permission === 'edit' ? 'Can Edit' : 'View Only'}
    </div>
  );

  const CountBadge = ({ count }: { count: number }) => (
    <div className="inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold ml-2">
      {count}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="shared">
          Shared Notes
          {sharedNotes.length > 0 && <CountBadge count={sharedNotes.length} />}
        </TabsTrigger>
        <TabsTrigger value="invites">
          Invitations
          {pendingInvites.length > 0 && <CountBadge count={pendingInvites.length} />}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shared" className="mt-4">
        <ScrollArea className="h-[500px] pr-4">
          {sharedNotes.length === 0 ? (
            <EmptyState
              title="No shared notes"
              description="Notes shared with you will appear here"
            />
          ) : (
            <div className="space-y-4">
              {sharedNotes.map((note) => (
                <Card 
                  key={note.id} 
                  className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{note.title}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <PermissionBadge permission={note.permission} />
                        <span className="text-sm text-muted-foreground">
                          Last active: {formatDate(note.lastActive)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="shrink-0 transition-all duration-200 hover:bg-primary hover:text-primary-foreground" 
                      asChild
                    >
                      <a href={`/notes/${note.id}`}>Open Note</a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="invites" className="mt-4">
        <ScrollArea className="h-[500px] pr-4">
          {pendingInvites.length === 0 ? (
            <EmptyState
              title="No pending invitations"
              description="When someone shares a note with you, it will appear here"
            />
          ) : (
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <Card 
                  key={invite.id} 
                  className="p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Note Invitation</h3>
                      <div className="mt-1 flex flex-col gap-2">
                        <PermissionBadge permission={invite.permission} />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Invited by: {invite.invitedBy}</p>
                          <p>Expires: {formatDate(invite.expiresAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => acceptInvitation(invite.id)}
                        className="transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineInvitation(invite.id)}
                        className="transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
