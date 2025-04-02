import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { friendId: string } }
) {
  try {
    const { friendId } = params;

    // Validate friendId
    if (!friendId || typeof friendId !== "string") {
      return NextResponse.json(
        { error: "Invalid friend ID format" },
        { status: 400 }
      );
    }

    // Database query with type safety
    const user = await db.user.findUnique({
      where: { id: friendId },
      select: { 
        name: true,
        id: true
      },
    });

    // Handle not found case
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Successful response
    return NextResponse.json(
      { data: { name: user.name } },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("[FRIEND_NAME_API_ERROR]", error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to fetch friend name";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}