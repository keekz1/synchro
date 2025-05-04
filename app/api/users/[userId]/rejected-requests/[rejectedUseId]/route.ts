 import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    
     const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.indexOf('users') + 1];
    const rejectedUserId = pathSegments[pathSegments.indexOf('rejected-requests') + 1];

    if (!currentUserId || !userId || !rejectedUserId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (currentUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to access this user's data" },
        { status: 403 }
      );
    }

    const rejectedRequest = await db.rejectedRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: rejectedUserId },
          { senderId: rejectedUserId, receiverId: userId }
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
      }
    });
    

    if (!rejectedRequest) {
      return NextResponse.json(
        { error: "Rejected request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rejectedRequest, { status: 200 });

  } catch (error) {
    console.error("Error fetching rejected request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}