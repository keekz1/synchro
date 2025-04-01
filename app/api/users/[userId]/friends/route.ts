import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// NextRequest is the correct type for handling requests
export async function GET(req: NextRequest) {
  try {
    // Extracting the userId directly from req.nextUrl.pathname
    const pathname = req.nextUrl.pathname; // Example: /api/users/123/friends
    const userId = pathname.split('/')[3]; // Extract userId by splitting the pathname

    // Ensure userId is valid (not undefined or empty)
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get unique friendships using Prisma
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: true,
        userB: true
      }
    });

    // Deduplication logic
    const seen = new Set<string>();
    const friends = friendships.flatMap(friendship => {
      const friend = friendship.userAId === userId ? 
        friendship.userB : 
        friendship.userA;
      
      if (seen.has(friend.id)) return [];
      seen.add(friend.id);
      return [friend];
    });

    return NextResponse.json(friends, { status: 200 });

  } catch (error) {
    console.error("[FRIENDS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
