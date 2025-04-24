// app/api/removeSkill/route.ts
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
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { skills: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedSkills = user.skills.filter(s => s !== skill);

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        skills: updatedSkills,
      },
    });

    return NextResponse.json({ message: "Skill removed successfully", user: updatedUser });
  } catch (error) {
    console.error("Error removing skill:", error);
    return NextResponse.json({ message: "Failed to remove skill" }, { status: 500 });
  }
}