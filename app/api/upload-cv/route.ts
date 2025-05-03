import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

     const { url: downloadURL } = await request.json();

    if (!downloadURL) {
      return NextResponse.json({ error: "No CV URL provided" }, { status: 400 });
    }

    await prisma.cV.upsert({
      where: { userId: session.user.id },
      create: {
        content: downloadURL,
        user: { connect: { id: session.user.id } }
      },
      update: {
        content: downloadURL,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      cvUrl: downloadURL
    });

  } catch (error) {
    console.error("CV save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}