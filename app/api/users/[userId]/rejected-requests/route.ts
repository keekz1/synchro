import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic'; // Ensure dynamic route handling

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required")
});

export async function GET(
  request: Request,
  context: { params: { userId: string } } // Use context to access params
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Authentication check
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access userId from context.params
    const userId = context.params.userId;
    const validatedParams = paramsSchema.parse({ userId });

    // Authorization check
    if (validatedParams.userId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch rejected requests
// app/api/users/[userId]/rejected-requests/route.ts
const rejectedRequests = await db.rejectedRequest.findMany({
  where: {
    senderId: validatedParams.userId // Filter by senderId = current user
  },
  select: {
    id: true,
    receiverId: true, // We only need who rejected the current user
    rejectedAt: true
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