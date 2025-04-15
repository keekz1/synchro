import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { type ExperienceLevel } from "@prisma/client";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Partial<{
      experience: ExperienceLevel;
      age: number;
      educationLevel: string[];
      openToWork: boolean;
    }> = {};

    // Only update fields that are provided
    if ('experience' in body) updateData.experience = body.experience;
    if ('age' in body) updateData.age = Number(body.age);
    if ('educationLevel' in body) updateData.educationLevel = body.educationLevel;
    if ('openToWork' in body) updateData.openToWork = Boolean(body.openToWork);

    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      openToWork: updatedUser.openToWork,
      // Include other fields if needed
    });

  } catch (error) {
    console.error("Error updating user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}