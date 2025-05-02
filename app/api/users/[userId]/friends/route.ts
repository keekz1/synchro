import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

 export async function GET(req: NextRequest) {
  try {
     const pathname = req.nextUrl.pathname;  
    const userId = pathname.split('/')[3];  

     if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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
