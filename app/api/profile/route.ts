import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming NextAuth is set up
import { db } from "@/lib/db"; // Your database helper

export async function GET() {
  try {
    // Get the session
    const session = await auth();
    console.log("Session Data:", session); // Debugging

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user details from the database, including the image URL
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true, image: true }, // Include image field
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user); // Now includes image URL
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
