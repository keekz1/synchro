// app/api/friendRequest/pending/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // Access params through context object directly
    const userId = context.params.userId;

    // Keep your existing database logic
    const requests = await db.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'pending' },
          { receiverId: userId, status: 'pending' }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}