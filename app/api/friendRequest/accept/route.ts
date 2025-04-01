import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Get the full friend request details
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true }
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Update the friend request status to "accepted"
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    // Create bidirectional friendships using the correct model name
    await prisma.friendship.createMany({
      data: [
        {
          userAId: friendRequest.senderId,
          userBId: friendRequest.receiverId
        },
        {
          userAId: friendRequest.receiverId,
          userBId: friendRequest.senderId
        }
      ]
    });

    return NextResponse.json(
      { 
        message: 'Friend request accepted and friendship established',
        request: updatedRequest 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}