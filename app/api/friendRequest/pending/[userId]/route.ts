import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Context = {
  params: {
    userId: string;
  };
};

export async function GET(request: NextRequest, context: Context) {
 try{ const { userId } = context.params;


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