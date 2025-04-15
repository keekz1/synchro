import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, ExperienceLevel } from "@prisma/client";

interface UserWithMatchScore {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skills: string[];
  educationLevel: string[];
  experience: ExperienceLevel | null;
  age: number | null;
  matchScore: number;
  openToWork: boolean; 
}

function experienceToYears(exp: ExperienceLevel | null): number {
  switch (exp) {
    case ExperienceLevel.LESS_THAN_1_YEAR: return 0.5;
    case ExperienceLevel.ONE_TO_2_YEARS: return 1.5;
    case ExperienceLevel.THREE_TO_5_YEARS: return 4;
    case ExperienceLevel.FIVE_PLUS_YEARS: return 6;
    default: return 0;
  }
}

function calculateMatchScore(
  user: {
    skills: string[];
    educationLevel: string[];
    experience: ExperienceLevel | null;
    age: number | null;
  },
  preference: {
    requiredSkills: string[];
    minExperience: number;
    educationLevel: string[];
    minAge: number;
    maxAge?: number;
  }
): number {
  let score = 0;

  // Experience match (30% weight)
  const userExperienceYears = user.experience ? 
    experienceToYears(user.experience) : 0;
  if (userExperienceYears >= preference.minExperience) {
    score += 30;
  }

  // Skills match (40% weight)
  const matchedSkills = user.skills.filter(skill => 
    preference.requiredSkills.includes(skill)
  );
  score += (matchedSkills.length / Math.max(1, preference.requiredSkills.length)) * 40;

  // Education match (20% weight)
  if (
    preference.educationLevel.length === 0 ||
    user.educationLevel.some(edu => preference.educationLevel.includes(edu))
  ) {
    score += 20;
  }

  // Age match (10% weight)
  if (
    user.age &&
    user.age >= preference.minAge &&
    (preference.maxAge ? user.age <= preference.maxAge : true)
  ) {
    score += 10;
  }

  return Math.round(score);
}

export async function POST(req: Request) {
  try {
    const preference = await req.json();

    // Fetch users with the same role
    const users = await prisma.user.findMany({
      where: {
        role: preference.role as UserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        educationLevel: true,
        experience: true,
        age: true,
        openToWork: true, // ← Add this line
      },
    });
    

    // Calculate match score for each user
    const matchedUsers: UserWithMatchScore[] = users.map((user) => ({
      ...user,
      educationLevel: user.educationLevel || [], // Handle potential undefined
      matchScore: calculateMatchScore(
        {
          skills: user.skills,
          educationLevel: user.educationLevel || [],
          experience: user.experience,
          age: user.age
        },
        preference
      )
    }));

    // Sort by match score (highest first)
    matchedUsers.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      users: matchedUsers,
    });
  } catch (error) {
    console.error("[MATCH_USERS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}