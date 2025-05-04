import { PrismaClient, UserRole, ExperienceLevel } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMatchedUsersForHRPreference() {
    const matchedUsers = await prisma.user.findMany({
    where: {
       age: { 
        gte: 25,  
      },
      experience: {
        equals: ExperienceLevel.ONE_TO_2_YEARS,  
      },
      role: UserRole.Software_Engineer,  
    }
  });

  return matchedUsers;
}

getMatchedUsersForHRPreference()
  .then(users => console.log(users))
  .catch(error => console.error(error));
