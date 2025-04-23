import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const requestSchema = z.object({
  friendId: z.string().min(1, "Friend ID is required")
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { friendId } = requestSchema.parse(body);

    // Delete the friendship between the users
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId }
        ]
      }
    });

    // Delete the friend requests between the users (both sent and received)
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      message: "Friendship and friend requests removed successfully"
    });

  } catch (error) {
    console.error("Error removing friendship and friend requests:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data", 
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
