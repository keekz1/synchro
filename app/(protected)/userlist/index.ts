// pages/api/userslist/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma'; // Assuming prisma client is set up in lib/prisma.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch all users from the database
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      res.status(200).json(users);  // Send the users as response
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    // Handle method not allowed
    res.status(405).json({ error: 'Method not allowed' });
  }
}
