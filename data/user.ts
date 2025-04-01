import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
    try {
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, password: true }, // Ensure these fields are selected
      });
  
      return user; // Return the full user object
    } catch (error) {
      console.error("Error fetching user:", error);
      return null; // Return null if any error occurs
    }
  };
  
export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null; // Return null if any error occurs
  }
};
