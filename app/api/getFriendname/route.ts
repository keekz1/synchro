import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // Ensure you have a Prisma client instance

// Define API to fetch the user's name by friendId
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { friendId } = req.query;

  if (!friendId || typeof friendId !== 'string') {
    return res.status(400).json({ error: 'Friend ID is required' });
  }

  try {
    // Query the Prisma database to get the user with the given friendId
    const user = await prisma.user.findUnique({
      where: { id: friendId },
      select: { name: true }, // Only select the name field
    });

    if (user) {
      return res.status(200).json({ name: user.name });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: 'Error fetching user from database' });
  }
}
