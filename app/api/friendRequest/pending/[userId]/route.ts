import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string | string[]> }
) {
  try {
    // Validate userId exists in params
    if (!params.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle both string and array cases (even for single segments)
    const userId = Array.isArray(params.userId)
      ? params.userId[0]  // Take first array element if present
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