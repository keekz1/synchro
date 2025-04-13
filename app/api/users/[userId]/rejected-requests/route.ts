import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Manual extraction of userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const requestedUserId = pathSegments[pathSegments.indexOf('users') + 1];

    if (currentUserId !== requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    return NextResponse.json(rejectedRequests);

  } catch (error) {
    console.error("Error fetching rejected requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// DELETE endpoint for removing from rejected list with override option
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const requestedUserId = params.userId;
    
    if (!currentUserId || currentUserId !== requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId, rejectionId, override } = body;
    
    if (!targetUserId || !rejectionId) {
      return NextResponse.json(
        { error: "Target user ID and rejection ID are required" },
        { status: 400 }
      );
    }

    // When overriding (just removing rejection without touching friend requests)
    if (override) {
      const deletedRejection = await db.rejectedRequest.delete({
        where: { 
          id: rejectionId,
          OR: [
            { senderId: targetUserId, receiverId: currentUserId },
            { senderId: currentUserId, receiverId: targetUserId }
          ]
        }
      });

      return NextResponse.json({
        success: true,
        message: "Rejection removed (override)",
        deletedRejection,
        override: true
      });
    }

    // Normal deletion (remove both rejection and related requests)
    const result = await db.$transaction([
      // 1. Delete the specific rejection record
      db.rejectedRequest.delete({
        where: { 
          id: rejectionId,
          OR: [
            { senderId: targetUserId, receiverId: currentUserId },
            { senderId: currentUserId, receiverId: targetUserId }
          ]
        }
      }),
      
      // 2. Delete all related friend requests between these users
      db.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUserId }
          ]
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "User removed from rejected list and related requests deleted",
      deletedRejection: result[0],
      deletedRequestsCount: result[1].count
    });

  } catch (error) {
    console.error("Error removing from rejected list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}