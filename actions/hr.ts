"use server";

import { UserRole, type ExperienceLevel } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRoles } from "@/app/api/role/route";

type LocationPreference = "REMOTE" | "HYBRID" | "ONSITE";

interface HRPreferences {
  name: string;
  requiredSkills: string[];
  minExperience: number;
  locationType: LocationPreference;
  educationLevel?: string[];
  minAge?: number;
  maxAge?: number;
  role: string;
}

interface RoleOption {
  value: string;
  label: string;
}

const MAX_PREFERENCES = 5;

const fetchValidRoles = async (): Promise<RoleOption[]> => {
  try {
    const { data: roles, error } = await getRoles();
    if (error) throw new Error(error);
    return roles || [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};

export const saveHRPreferences = async (preferences: HRPreferences) => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Forbidden Server Action!" };
  }

  try {
    // Check if user has reached maximum preference sets
    const existingCount = await db.hRPreferences.count({
      where: { userId: user.id }
    });
    
    if (existingCount >= MAX_PREFERENCES) {
      return { error: `Maximum of ${MAX_PREFERENCES} preference sets allowed` };
    }

    const validRoles = await fetchValidRoles();
    const isValidRole = validRoles.some(role => role.value === preferences.role);
    
    if (!isValidRole) {
      return { error: "Invalid role selected" };
    }

    const updatedPreferences = {
      ...preferences,
      minAge: preferences.minAge ?? 19,
      educationLevel: preferences.educationLevel || [],
    };

    const result = await db.hRPreferences.create({
      data: {
        ...updatedPreferences,
        userId: user.id,
      },
    });

    return { 
      success: "Preferences saved successfully!",
      preferences: result 
    };

  } catch (error) {
    console.error("Error saving HR preferences:", error);
    return { error: "Failed to save preferences" };
  }
};

export const updateHRPreferences = async (id: string, preferences: Partial<HRPreferences>) => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Forbidden Server Action!" };
  }

  try {
    const result = await db.hRPreferences.update({
      where: { 
        id_userId: {
          id,
          userId: user.id
        }
      },
      data: preferences
    });

    return { 
      success: true,
      preference: result  // renamed to `preference` to match frontend
    };
  } catch (error) {
    console.error("Error updating HR preferences:", error);
    return { error: "Failed to update preferences" };
  }
};


export const getAllHRPreferences = async () => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Unauthorized" };
  }

  try {
    const preferences = await db.hRPreferences.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return { preferences };
  } catch (error) {
    console.error("Error fetching HR preferences:", error);
    return { error: "Failed to fetch preferences" };
  }
};

export const getHRPreferenceById = async (id: string) => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Unauthorized" };
  }

  try {
    const preference = await db.hRPreferences.findUnique({
      where: { 
        id_userId: {  // Using compound unique identifier
          id,
          userId: user.id
        }
      }
    });

    if (!preference) {
      return { error: "Preference set not found" };
    }

    return { preference };
  } catch (error) {
    console.error("Error fetching HR preference:", error);
    return { error: "Failed to fetch preference" };
  }
};

export const deleteHRPreference = async (id: string) => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Unauthorized" };
  }

  try {
    await db.hRPreferences.delete({
      where: { 
        id_userId: {  // Using compound unique identifier
          id,
          userId: user.id
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting HR preference:", error);
    return { error: "Failed to delete preference" };
  }
};
export const getMatchedUsersForHRPreference = async (preferenceId: string) => {
  const user = await currentUser();

  if (!user || user.role !== UserRole.HR) {
    return { error: "Unauthorized access" };
  }

  const preference = await db.hRPreferences.findUnique({
    where: { id: preferenceId }
  });

  if (!preference) {
    return { error: "Preference not found" };
  }

  const {
    role,
    locationType,
    minExperience,
    educationLevel,
    requiredSkills,
    minAge
  } = preference;

  try {
    const matchedUsers = await db.user.findMany({
      where: {
        role,
        locationType,
        experience: { gte: minExperience },
        age: { gte: minAge },
        educationLevel: {
          in: educationLevel.length ? educationLevel : undefined
        },
        skills: {
          hasEvery: requiredSkills.length ? requiredSkills : undefined
        },
        NOT: { role: UserRole.HR }
      }
    });

    return { matchedUsers };
  } catch (error) {
    console.error("Error fetching matched users:", error);
    return { error: "Failed to retrieve matched users" };
  }
};

export const getCandidateSkillsAnalysis = async (preferenceId?: string) => {
  const user = await currentUser();
  if (!user || user.role !== UserRole.HR) {
    return { error: "Unauthorized" };
  }

  try {
    // If preferenceId is provided, filter candidates based on those preferences
    let whereClause: any = { 
      role: UserRole.USER,
      skills: { isEmpty: false } 
    };

    if (preferenceId) {
      const preference = await db.hRPreferences.findUnique({
        where: { 
          id_userId: {  // Using compound unique identifier
            id: preferenceId,
            userId: user.id
          }
        }
      });

      if (preference) {
        whereClause = {
          ...whereClause,
          AND: [
            { skills: { hasSome: preference.requiredSkills } },
            { role: preference.role },
            preference.minAge ? { age: { gte: preference.minAge } } : {},
            preference.maxAge ? { age: { lte: preference.maxAge } } : {},
          ].filter(Boolean)
        };
      }
    }

    const candidates = await db.user.findMany({
      where: whereClause,
      select: { 
        skills: true, 
        experience: true 
      }
    });

    const skillFrequency = candidates.reduce((acc: Record<string, number>, candidate) => {
      candidate.skills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {});

    const sortedSkills = Object.entries(skillFrequency)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    const totalExperience = candidates.reduce((sum, candidate) => {
      return sum + (candidate.experience ? convertExperience(candidate.experience) : 0);
    }, 0);

    return {
      totalCandidates: candidates.length,
      mostCommonSkills: sortedSkills.slice(0, 5),
      leastCommonSkills: sortedSkills.slice(-5).reverse(),
      averageExperience: totalExperience / candidates.length || 0
    };
    
  } catch (error) {
    console.error("Error in candidate analysis:", error);
    return { error: "Failed to analyze candidates" };
  }
};

const convertExperience = (expLevel: ExperienceLevel): number => {
  switch (expLevel) {
    case 'LESS_THAN_1_YEAR': return 0.5;
    case 'ONE_TO_2_YEARS': return 1.5;
    case 'THREE_TO_5_YEARS': return 4;
    case 'FIVE_PLUS_YEARS': return 6;
    default: return 0;
  }
};