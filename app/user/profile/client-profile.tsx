'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import ProfileForm from './profile-form';

interface Props {
  session: Session | null;
}

const TypedSessionProvider = SessionProvider as unknown as React.ComponentType<{
  session: Session | null;
  children: React.ReactNode;
}>;

export default function ClientWrapper({ session }: Props) {
  return (
    <TypedSessionProvider session={session}>
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="h2-bold">Profile</h2>
        <ProfileForm />
      </div>
    </TypedSessionProvider>
  );
}