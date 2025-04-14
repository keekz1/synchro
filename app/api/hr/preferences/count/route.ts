import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.hRPreferences.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[HR_PREFERENCES_COUNT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}