import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Using auth() from your auth.ts
import { db } from "@/lib/db"; // Ensure this path is correct

export async function PUT(req: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { newRole } = await req.json();

  try {
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { role: newRole || "" }, // If newRole is an empty string, it will set it as empty
    });

    return NextResponse.json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ message: "Failed to update role" }, { status: 500 });
  }
}
