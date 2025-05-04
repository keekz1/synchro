 import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
       const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      res.status(200).json(users);   
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
     res.status(405).json({ error: 'Method not allowed' });
  }
}
