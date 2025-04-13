// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } } // Properly typed params
) {
  try {
    const session = await auth();
    const userId = params.userId; // No await needed - params is already available

    if (!userId || !session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    return NextResponse.json(rejectedRequests, { status: 200 });

  } catch (error) {
    console.error("Error fetching rejected requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}