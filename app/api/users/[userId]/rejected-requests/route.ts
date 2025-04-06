import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic'; // Ensure dynamic route handling

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required")
});

// Updated type definition for GET function
export async function GET(
  request: Request,
  { params }: { params: { userId: string } } // Destructure params directly
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

    // Validate params
    const validatedParams = paramsSchema.parse(params); // Pass the entire params object

    // Authorization check
    if (validatedParams.userId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch rejected requests
    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: validatedParams.userId }, // Requests the user sent that were rejected
          { receiverId: validatedParams.userId } // Requests the user received and rejected
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