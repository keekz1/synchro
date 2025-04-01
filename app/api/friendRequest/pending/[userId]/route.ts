import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  userId?: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    // Ensure userId exists
    if (!params?.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userId = params.userId;

    // Fetch pending friend requests
    const requests = await db.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: "pending" },
          { receiverId: userId, status: "pending" },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
