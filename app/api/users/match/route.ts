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
  preferredAreas: string[];
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
    preferredAreas: string[];
    experience: ExperienceLevel | null;
    age: number | null;
  },
  preference: {
    requiredSkills: string[];
    minExperience: number;
    educationLevel: string[];
    minAge: number;
    maxAge?: number;
    hiringLocation: string[];
  }
): number {
  let score = 0;
  let locationMatch = true;  
 
if (preference.hiringLocation.length > 0) {
  locationMatch = user.preferredAreas.length > 0 &&  
                 user.preferredAreas.some(area => 
                   preference.hiringLocation.some(hl => 
                     hl.toLowerCase().includes(area.toLowerCase()) ||
                     area.toLowerCase().includes(hl.toLowerCase())
                   )
                 );
  
   if (!locationMatch) return 0;
}
  // Experience  (30 points)
  const userExperienceYears = user.experience ? experienceToYears(user.experience) : 0;
  if (userExperienceYears >= preference.minExperience) score += 30;

  // Skills  (40 points)
  const matchedSkills = user.skills.filter(skill => preference.requiredSkills.includes(skill));
  score += (matchedSkills.length / Math.max(1, preference.requiredSkills.length)) * 40;

  // Education  (20 points)
  if (preference.educationLevel.length === 0 || 
      user.educationLevel.some(edu => preference.educationLevel.includes(edu))) {
    score += 20;
  }

  // Age (10 points)
  if (user.age && user.age >= preference.minAge && 
      (preference.maxAge ? user.age <= preference.maxAge : true)) {
    score += 10;
  }

   if (locationMatch && preference.hiringLocation.length > 0) {
    score += 20;
  }

  return Math.min(100, Math.round(score));  
}

export async function POST(req: Request): Promise<NextResponse<{ users: UserWithMatchScore[] } | { error: string }>> {
  try {
    const preference = await req.json();
    
    if (!preference.role || !preference.requiredSkills) {
      return NextResponse.json({ error: "Invalid preference data" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { 
        role: preference.role as UserRole,
        openToWork: true
      },
      include: { 
        cv: true 
      },
    });

    const matchedUsers: UserWithMatchScore[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      educationLevel: user.educationLevel || [],
      preferredAreas: user.preferredAreas || [],
      experience: user.experience,
      age: user.age,
      openToWork: user.openToWork,
      cv: user.cv || undefined,
      matchScore: calculateMatchScore(
        {
          skills: user.skills,
          educationLevel: user.educationLevel || [],
          preferredAreas: user.preferredAreas || [],
          experience: user.experience,
          age: user.age
        },
        {
          requiredSkills: preference.requiredSkills || [],
          minExperience: preference.minExperience || 0,
          educationLevel: preference.educationLevel || [],
          minAge: preference.minAge || 18,
          maxAge: preference.maxAge,
          hiringLocation: preference.hiringLocation || []
        }
      )
    }));

    const filteredUsers = matchedUsers
    .filter(user => user.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

    return NextResponse.json({ users: filteredUsers });
  } catch (error: unknown) {
    console.error("[MATCH_USERS_ERROR]", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}