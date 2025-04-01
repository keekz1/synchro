import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Define GET function properly typed with NextRequest as the first argument
export async function GET(req: NextRequest, context: { params: { userId: string } }) {
  try {
    const { userId } = context.params; // Get userId from context.params

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
