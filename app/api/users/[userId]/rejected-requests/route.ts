import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const { userId } = z.object({ userId: z.string() }).parse(params);

    if (userId !== currentUserId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

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
      orderBy: {
        rejectedAt: 'desc'
      }
    });

    return new NextResponse(JSON.stringify(rejectedRequests), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching rejected requests:', error);

    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid parameters", details: error.errors }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}