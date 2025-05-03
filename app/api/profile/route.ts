import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        skills: true,
        experience: true,
        age: true,
        educationLevel: true,
        openToWork: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

     const userCV = await db.cV.findUnique({
      where: { userId: user.id },
      select: { 
        content: true,   
        createdAt: true,
        updatedAt: true
      },
    });

    return NextResponse.json({
      ...user,
      cv: userCV || null,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}