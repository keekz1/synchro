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

    // Update the friend request status to "rejected"
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}