import { Metadata } from 'next';
import { auth } from '@/auth';
import ClientWrapper from './client-profile'; 

export const metadata: Metadata = {
  title: 'Customer Profile',
};

const Profile = async () => {
  const session = await auth();

  return <ClientWrapper session={session} />;
};

export default Profile;