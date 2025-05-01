"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/actions/logout";

export const deleteUser = async (reason?: string) => {
  try {
     const user = await currentUser();
    if (!user?.id) {
      return { error: "Unauthorized" };
    }

     const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true }  
    });
    
    if (!dbUser) {
      return { error: "User not found" };
    }

     if (reason) {
      await db.deleteReason.create({
        data: {
          userId: user.id,
          reason: reason,
          createdAt: new Date()
        }
      });
    }

     await db.$transaction([
       db.account.deleteMany({
        where: { userId: user.id }
      }),
       db.user.delete({
        where: { id: user.id }
      })
    ]);

     await logout();

    return { 
      success: "Account deleted successfully",
      redirectUrl: "/auth/login"  
    };

  } catch (error) {
    console.error("Delete User Error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to delete account"
    };
  }
};