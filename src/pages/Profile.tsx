import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollaborationsTab } from '@/components/CollaborationsTab';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ProfilePage() {
  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Profile</h1>

      <Tabs defaultValue="collaborations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations" className="space-y-6">
          <CollaborationsTab />
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-lg border p-8">
            <h2 className="text-lg font-semibold">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">
              Profile settings will be available soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Wrap with ProtectedRoute to ensure only authenticated users can access
export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
