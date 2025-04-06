// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parameter validation
    const paramsSchema = z.object({
      userId: z.string().min(1)
    });
    
    const { userId } = paramsSchema.parse(context.params);

    // Authorization
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}