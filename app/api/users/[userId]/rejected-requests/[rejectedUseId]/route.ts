// app/api/users/[userId]/rejected-requests/[rejectedUserId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; rejectedUserId: string } }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const { userId, rejectedUserId } = params;

    // Authorization check
    if (!currentUserId || currentUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the specific rejected request
    const rejectedRequest = await db.rejectedRequest.findFirst({
      where: {
        id: rejectedUserId,
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