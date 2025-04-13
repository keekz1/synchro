import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// Helper function to extract userId from URL
function getUserIdFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    const pathSegments = url.pathname.split('/');
    return pathSegments[pathSegments.indexOf('users') + 1] || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const requestedUserId = getUserIdFromUrl(request.url);

    if (!currentUserId || !requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      },
      orderBy: {
        rejectedAt: "desc"
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const requestedUserId = getUserIdFromUrl(request.url);

    if (!currentUserId || !requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUserId !== requestedUserId) {
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

    const result = await db.$transaction([
      db.rejectedRequest.delete({
        where: { 
          id: rejectionId,
          OR: [
            { senderId: targetUserId, receiverId: currentUserId },
            { senderId: currentUserId, receiverId: targetUserId }
          ]
        }
      }),
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