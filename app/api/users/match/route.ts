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
  cv?: {
    content: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
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
  const userExperienceYears = user.experience ? experienceToYears(user.experience) : 0;
  if (userExperienceYears >= preference.minExperience) score += 30;
  const matchedSkills = user.skills.filter(skill => preference.requiredSkills.includes(skill));
  score += (matchedSkills.length / Math.max(1, preference.requiredSkills.length)) * 40;
  if (preference.educationLevel.length === 0 || user.educationLevel.some(edu => preference.educationLevel.includes(edu))) score += 20;
  if (user.age && user.age >= preference.minAge && (preference.maxAge ? user.age <= preference.maxAge : true)) score += 10;
  return Math.round(score);
}

export async function POST(req: Request): Promise<NextResponse<{ users: UserWithMatchScore[] } | { error: string }>> {
  try {
    const preference = await req.json();
    const users = await prisma.user.findMany({
      where: { role: preference.role as UserRole },
      include: { cv: true },
    });

    const matchedUsers: UserWithMatchScore[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      educationLevel: user.educationLevel || [],
      experience: user.experience,
      age: user.age,
      openToWork: user.openToWork,
      cv: user.cv || undefined,
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

    matchedUsers.sort((a, b) => b.matchScore - a.matchScore);
    return NextResponse.json({ users: matchedUsers });
  } catch (error: unknown) {
    console.error("[MATCH_USERS_ERROR]", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}