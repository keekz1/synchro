import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// Helper function to extract userId from URL
function getUserIdFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    const pathSegments = url.pathname.split('/');
    const userIdIndex = pathSegments.indexOf('users') + 1;
    return userIdIndex > 0 && userIdIndex < pathSegments.length ? pathSegments[userIdIndex] : null;
  } catch (error) {
    console.error("Error parsing URL:", error instanceof Error ? error.message : String(error));
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
        { error: "Unauthorized: Missing user ID" },
        { status: 401 }
      );
    }

    if (currentUserId !== requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized: User mismatch" },
        { status: 401 }
      );
    }

    // Fetch valid rejected requests
    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        rejectedAt: "desc",
      },
    });

    return NextResponse.json(rejectedRequests);
  } catch (error) {
    console.error(
      "Error fetching rejected requests:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
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
        { error: "Unauthorized: Missing user ID" },
        { status: 401 }
      );
    }

    if (currentUserId !== requestedUserId) {
      return NextResponse.json(
        { error: "Unauthorized: User mismatch" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId, rejectionId, override } = body;

    if (!targetUserId || !rejectionId) {
      return NextResponse.json(
        { error: "Bad Request: Target user ID and rejection ID are required" },
        { status: 400 }
      );
    }

    if (override) {
      try {
        const deletedRejection = await db.rejectedRequest.delete({
          where: { 
            id: rejectionId,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Rejection removed (override)",
          deletedRejection,
          override: true,
        });
      } catch (error) {
        console.error(
          "Error during override deletion:",
          error instanceof Error ? error.message : String(error)
        );
        return NextResponse.json(
          { error: "Internal server error during override deletion", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    try {
      const result = await db.$transaction([
        db.rejectedRequest.delete({
          where: { id: rejectionId },
        }),
        db.friendRequest.deleteMany({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: currentUserId },
            ],
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "User removed from rejected list and related requests deleted",
        deletedRejection: result[0],
        deletedRequestsCount: result[1].count,
      });
    } catch (error) {
      console.error(
        "Error during transaction deletion:",
        error instanceof Error ? error.message : String(error)
      );
      return NextResponse.json(
        { error: "Internal server error during transaction deletion", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "Error removing from rejected list:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}