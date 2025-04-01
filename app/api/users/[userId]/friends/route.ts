import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Export GET function properly typed with `NextRequest` as the first argument
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Destructure the userId from params
    const { userId } = params;

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

    // Return the friends data as JSON
    return NextResponse.json(friends, { status: 200 });

  } catch (error) {
    console.error("[FRIENDS_GET]", error);
    // Handle errors and send a proper response
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
