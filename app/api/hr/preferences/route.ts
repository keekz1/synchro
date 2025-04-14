import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "HR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const preferences = await db.hRPreferences.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, email: true, image: true } } }
    });
    
    if (!preferences) {
      return NextResponse.json({ error: "Preferences not found" }, { status: 404 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[HR_PREFERENCES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    if (!session?.user || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPreferences = await db.hRPreferences.findUnique({
      where: { userId: session.user.id }
    });

    const preferences = existingPreferences 
      ? await db.hRPreferences.update({
          where: { userId: session.user.id },
          data: body
        })
      : await db.hRPreferences.create({
          data: {
            ...body,
            userId: session.user.id
          }
        });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[HR_PREFERENCES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}