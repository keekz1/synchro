import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.pathname.split("/")[3];

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        friendshipsAsUserA: {
          include: { userB: true },
        },
        friendshipsAsUserB: {
          include: { userA: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friends = [
      ...user.friendshipsAsUserA.map(f => f.userB),
      ...user.friendshipsAsUserB.map(f => f.userA),
    ];

     const uniqueFriends = Array.from(
      new Map(friends.map(friend => [friend.id, friend])).values()
    );

    return NextResponse.json(uniqueFriends, { status: 200 });

  } catch (error) {
    console.error("[FRIENDS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
