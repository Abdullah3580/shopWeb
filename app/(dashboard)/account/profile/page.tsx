
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <form action={updateProfile} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name || ''} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone || ''} />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" name="gender" defaultValue={profile?.gender || ''} />
        </div>
        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={profile?.date_of_birth || ''} />
        </div>
        {/* Avatar upload would go here */}
        <Button type="submit">Update Profile</Button>
      </form>
    </div>
  );
}
