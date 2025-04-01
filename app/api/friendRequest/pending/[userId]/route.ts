import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params?: { userId: string | string[] } } // Mark params as optional
) {
  try {
    // Validate userId exists
    if (!params?.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle both string and array cases
    const userId = Array.isArray(params.userId)
      ? params.userId[0] // Use first element if array
      : params.userId;

    const requests = await db.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: "pending" },
          { receiverId: userId, status: "pending" },
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