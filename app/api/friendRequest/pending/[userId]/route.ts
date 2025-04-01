import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params?: { [key: string]: string | string[] } }
) {
  try {
    // Validate userId existence and type
    const userId = context.params?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle array format (even for single segments)
    const userIdString = Array.isArray(userId)
      ? userId[0]  // Use first array element if present
      : userId;

    const requests = await db.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userIdString, status: "pending" },
          { receiverId: userIdString, status: "pending" },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}