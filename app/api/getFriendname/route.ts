// app/api/getFriendName/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure you have a Prisma client instance

// Define API to fetch the user's name by friendId
export async function GET(request: Request) {
  const url = new URL(request.url);
  const friendId = url.searchParams.get('friendId'); // Extract query parameter

  if (!friendId || typeof friendId !== 'string') {
    return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
  }

  try {
    // Query the Prisma database to get the user with the given friendId
    const user = await prisma.user.findUnique({
      where: { id: friendId },
      select: { name: true }, // Only select the name field
    });

    if (user) {
      return NextResponse.json({ name: user.name }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error fetching user from database' }, { status: 500 });
  }
}
