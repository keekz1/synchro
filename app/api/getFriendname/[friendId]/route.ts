import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { friendId: string } }) {
  try {
    const { friendId } = params; // Get friendId from the path parameter

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    // Query the database using the friendId
    const user = await db.user.findUnique({
      where: { id: friendId },
      select: { name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ name: user.name }, { status: 200 });
  } catch (error) {
    console.error("[GET_FRIEND_NAME_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
