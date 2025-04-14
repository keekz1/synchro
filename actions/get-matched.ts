import { PrismaClient, UserRole, ExperienceLevel } from '@prisma/client';

const prisma = new PrismaClient();

// Define the action function
export async function getMatchedUsersForHRPreference() {
  const matchedUsers = await prisma.user.findMany({
    where: {
      age: { 
        gte: 25, // Adjust the age filter as necessary
      },
      experience: {
        equals: ExperienceLevel.ONE_TO_2_YEARS, // Use valid enum for experience
      },
      role: UserRole.Software_Engineer, // Ensure the correct role is used for filtering
    },
  });

  return matchedUsers;
}
