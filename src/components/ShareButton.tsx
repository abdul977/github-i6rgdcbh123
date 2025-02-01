import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { inviteCollaborator, generateShareLink } from '@/lib/collaborators';
import { Copy, Share2, Link as LinkIcon } from 'lucide-react';

interface ShareButtonProps {
  noteId: string;
  currentUserId: string;
}

export function ShareButton({ noteId, currentUserId }: ShareButtonProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [shareLink, setShareLink] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Generate a unique user ID based on email
      const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const success = await inviteCollaborator(noteId, {
        user_id: userId,
        email,
        permission,
        display_name: email.split('@')[0]
      });

      if (success) {
        toast({
          title: 'Collaborator Invited',
          description: `${email} has been invited with ${permission} access`,
          variant: 'default'
        });
        setEmail('');
      } else {
        toast({
          title: 'Invitation Failed',
          description: 'Unable to invite collaborator. They may already have access.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { url, error } = await generateShareLink(noteId);
      
      if (error || !url) {
        throw error || new Error('Failed to generate share link');
      }

      setShareLink(url);
      
      toast({
        title: 'Share Link Generated',
        description: 'The share link has been generated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) {
      await handleGenerateShareLink();
    }
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: 'Share Link Copied',
        description: 'The share link has been copied to your clipboard',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy share link',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Share2 className="h-4 w-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Share Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invite by Email Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Invite Collaborator</h3>
            <div className="flex space-x-2">
              <Input 
                placeholder="Collaborator's email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select 
                value={permission}
                onValueChange={(value: 'view' | 'edit') => setPermission(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleInvite} 
              className="w-full"
              disabled={!email}
            >
              Send Invitation
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or share via link
              </span>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Share Link</h3>
            <div className="flex space-x-2">
              <Input
                value={shareLink}
                placeholder="Generate a share link..."
                readOnly
                className="flex-1"
              />
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={handleGenerateShareLink}
                disabled={isGeneratingLink}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleCopyShareLink}
              disabled={isGeneratingLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Share Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}