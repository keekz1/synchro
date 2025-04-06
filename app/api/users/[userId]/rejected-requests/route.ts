import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required")
});

// Corrected function signature
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const validatedParams = paramsSchema.parse(params);

    if (validatedParams.userId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: validatedParams.userId },
          { receiverId: validatedParams.userId }
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

    return NextResponse.json(rejectedRequests);
  } catch (error) {
    console.error('Error fetching rejected requests:', error);

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