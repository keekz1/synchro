import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { skill } = await req.json();

  if (!skill || typeof skill !== "string" || !skill.trim()) {
    return NextResponse.json({ message: "Invalid skill input" }, { status: 400 });
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        skills: {
          push: skill.trim(),
        },
      },
    });

    return NextResponse.json({ message: "Skill added successfully", user: updatedUser });
  } catch (error) {
    console.error("Error adding skill:", error);
    return NextResponse.json({ message: "Failed to add skill" }, { status: 500 });
  }
}
