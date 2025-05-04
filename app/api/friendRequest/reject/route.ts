import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { pusherServer } from '@/lib/pusher';
import { z } from 'zod';
import { db as firestore } from '@/lib/firebase';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const rejectSchema = z.object({
  requestId: z.string().min(1, "Request ID is required")
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { requestId } = rejectSchema.parse(body);

     const request = await db.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true }
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Friend request not found" },
        { status: 404 }
      );
    }

    if (request.receiverId !== currentUserId) {
      return NextResponse.json(
        { success: false, error: "You can only reject requests sent to you" },
        { status: 403 }
      );
    }

     await db.$transaction([
      db.friendRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      }),
      db.rejectedRequest.create({
        data: {
          senderId: request.senderId,
          receiverId: currentUserId
        }
      })
    ]);

     try {
      const requestRef = doc(firestore, 'users', currentUserId, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
    } catch (firestoreError) {
      console.error('Firestore update failed:', firestoreError);
    }

     try {
      await pusherServer.trigger(
        `user-${request.sender.id}`,
        "friend-request:rejected",
        { requestId }
      );
    } catch (error) {
      console.error("Pusher error:", error);
    }

    return NextResponse.json(
      { success: true, message: "Request rejected" },
      { status: 200 }
    );

  } catch (error) {
    console.error('Rejection error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}