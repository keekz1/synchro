// lib/collab-data.ts
import { GetStaticProps } from 'next';
import { User, FriendRequest } from '@prisma/client';

export const getCollabPageProps = async () => {
  // Your data fetching logic here
  return {
    props: {
      fallback: {
        users: [], // Fetch users
        friends: [], // Fetch friends
        pendingRequests: [] // Fetch pending requests
      }
    },
    revalidate: 60
  };
};