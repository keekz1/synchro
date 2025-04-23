import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
 const acceptSchema = z.object({
  requestId: z.string().min(1, "Request ID is required")
});

export async function POST(request: Request) {
  try {
     const body = await request.json();
    const { requestId } = acceptSchema.parse(body);

     const result = await db.$transaction(async (tx) => {
      // 1. Get and validate the request
      const friendRequest = await tx.friendRequest.findUnique({
        where: { id: requestId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      if (!friendRequest) {
        throw new Error('Friend request not found');
      }

      // 2. Update the request status
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      // 3. Create bidirectional friendships using upsert to avoid duplicates
      await tx.friendship.upsert({
        where: {
          userAId_userBId: {
            userAId: friendRequest.senderId,
            userBId: friendRequest.receiverId
          }
        },
        create: {
          userAId: friendRequest.senderId,
          userBId: friendRequest.receiverId
        },
        update: {}
      });

      await tx.friendship.upsert({
        where: {
          userAId_userBId: {
            userAId: friendRequest.receiverId,
            userBId: friendRequest.senderId
          }
        },
        create: {
          userAId: friendRequest.receiverId,
          userBId: friendRequest.senderId
        },
        update: {}
      });

      return {
        sender: friendRequest.sender,
        receiver: friendRequest.receiver
      };
    });

    // ... rest of the Firebase and Pusher code remains the same ...

    return NextResponse.json(
      { 
        success: true,
        message: 'Friend request accepted',
        requestId,
        friendId: result.receiver.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error accepting friend request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        ...(process.env.NODE_ENV === "development" && { stack: (error as Error)?.stack })
      },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 }
    );
  }
}