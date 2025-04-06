// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // Authentication
    const session = await auth();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      return NextResponse.json('Unauthorized', { status: 401 });
    }

    // Extract and validate params
    const userId = context.params.userId;
    if (typeof userId !== 'string') {
      return NextResponse.json('Invalid user ID', { status: 400 });
    }

    // Authorization
    if (userId !== currentUserId) {
      return NextResponse.json('Forbidden', { status: 403 });
    }

    // Database query
    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      },
      orderBy: { rejectedAt: 'desc' }
    });

    return NextResponse.json(rejectedRequests);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json('Internal Server Error', { status: 500 });
  }
}