import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
    try {
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, emailVerified:true,isTwoFactorEnabled:true, email: true, name: true, password: true }, 
      });
  
      return user;  
    } catch (error) {
      console.error("Error fetching user:", error);
      return null; 
    }
  };
  
export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;  
  }
};
