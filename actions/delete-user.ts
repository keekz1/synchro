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
       db.message.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
       db.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
       db.rejectedRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
       db.friendship.deleteMany({
        where: {
          OR: [
            { userAId: user.id },
            { userBId: user.id }
          ]
        }
      }),
      
       db.hRPreferences.deleteMany({
        where: { userId: user.id }
      }),
      
       db.twoFactorConfirmation.deleteMany({
        where: { userId: user.id }
      }),
      
       db.account.deleteMany({
        where: { userId: user.id }
      }),
      
       db.user.delete({
        where: { id: user.id }
      })
    ]);

     await logout();

    return { 
      success: "Account and all related data deleted successfully",
      redirectUrl: "/auth/login"
    };

  } catch (error) {
    console.error("Complete User Deletion Error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to delete account and related data"
    };
  }
};