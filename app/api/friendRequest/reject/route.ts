// app/api/friendRequest/reject/route.ts
import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { auth } from '@/auth';
import { pusherServer } from '@/lib/pusher';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { setDoc } from "firebase/firestore"; 

const rejectSchema = z.object({
  requestId: z.string().min(1, "Request ID is required")
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Authentication check
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { requestId } = rejectSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get the request with relations
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
          receiver: { select: { id: true } }
        }
      });

      // Request validation
      if (!request) {
        throw new Error("Friend request not found");
      }
      if (request.receiverId !== currentUserId) {
        throw new Error("You can only reject requests sent to you");
      }

      // Create rejected record
      await tx.rejectedRequest.create({
        data: {
          senderId: request.senderId,
          receiverId: request.receiverId,
          rejectedAt: new Date()
        }
      });

      // Update Firestore status
      try {
        const requestRef = doc(db, 'users', request.receiverId, 'friendRequests', requestId);
        await updateDoc(requestRef, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn('Firestore update failed:', firestoreError);
        // Continue even if Firestore fails
      }

      // Delete the original request
      await tx.friendRequest.delete({ where: { id: requestId } });

      return { 
        requestId,
        sender: request.sender,
        receiverId: request.receiverId 
      };
    });

    // Real-time notifications
    try {
      await Promise.all([
        pusherServer.trigger(
          `user-${result.sender.id}`,
          "friend-request:rejected",
          { 
            requestId: result.requestId,
            rejectedAt: new Date().toISOString()
          }
        ),
        // Add notification to sender's Firestore
        setDoc(doc(db, 'users', result.sender.id, 'notifications', result.requestId), {
          type: 'friend-request-rejected',
          from: {
            id: currentUserId,
            name: session.user?.name,
            email: session.user?.email,
            image: session.user?.image
          },
          createdAt: serverTimestamp(),
          read: false,
          requestId: result.requestId
        })
      ]);
    } catch (realtimeError) {
      console.error("Realtime notifications failed:", realtimeError);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Friend request rejected successfully",
        requestId: result.requestId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Rejection error:', error);
    
    let status = 500;
    let errorMessage = "Internal server error";

    if (error instanceof z.ZodError) {
      status = 422;
      errorMessage = "Validation failed";
    } else if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("You can only reject")) {
        status = 403;
      } else if (error.message.includes("not found")) {
        status = 404;
      }
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(error instanceof z.ZodError && { details: error.errors })
      },
      { status }
    );
  }
}