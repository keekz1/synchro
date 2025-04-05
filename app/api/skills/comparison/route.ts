import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, skills: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all users with same role (excluding current user)
    const peers = await db.user.findMany({
      where: {
        role: currentUser.role,
        id: { not: currentUser.id }
      },
      select: { skills: true }
    });

    // Flatten all peer skills and calculate frequency
    const skillFrequency: Record<string, number> = {};
    peers.forEach(user => {
      user.skills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    // Convert to sorted array
    const sortedSkills = Object.entries(skillFrequency)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    // Get top 5 and bottom 5 skills
    const mostPopular = sortedSkills.slice(0, 5);
    const leastPopular = sortedSkills.slice(-5).reverse();

    return NextResponse.json({
      currentSkills: currentUser.skills,
      peerSkills: Object.keys(skillFrequency),
      mostPopular,
      leastPopular,
      totalPeers: peers.length
    });

  } catch (error) {
    console.error("Error in skill comparison:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}