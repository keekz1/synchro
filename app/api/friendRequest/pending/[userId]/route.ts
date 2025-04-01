// app/api/friendRequest/pending/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } } // ✅ Correct parameter extraction
) {
  try {
    const userId = params.userId; // ✅ Now correctly extracted

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
