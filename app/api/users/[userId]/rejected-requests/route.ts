// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Extract userId from URL path
    const pathname = req.nextUrl.pathname; // Should be: /api/users/[userId]/rejected-requests
    const userId = pathname.split('/')[3]; // Split by '/' and get 4th segment

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Your existing rejected requests logic
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
      },
      orderBy: {
        rejectedAt: 'desc'
      }
    });

    return NextResponse.json(rejectedRequests, { status: 200 });

  } catch  {
    console.error("[REJECTED_REQUESTS_GET]");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}