"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/actions/logout";

export const deleteUser = async (reason?: string) => {
  try {
    // 1. Get and validate current user
    const user = await currentUser();
    if (!user?.id) {
      return { error: "Unauthorized" };
    }

    // 2. Store deletion reason if provided
    if (reason) {
      await db.deleteReason.create({
        data: {
          userId: user.id,
          reason: reason,
          createdAt: new Date()
        }
      });
    }

    // 3. Perform complete user data deletion in transaction
    await db.$transaction([
      // Delete all related messages
      db.message.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
      // Delete all friend requests
      db.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
      // Delete all rejected requests
      db.rejectedRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      
      // Delete all friendships
      db.friendship.deleteMany({
        where: {
          OR: [
            { userAId: user.id },
            { userBId: user.id }
          ]
        }
      }),
      
      // Delete HR preferences
      db.hRPreferences.deleteMany({
        where: { userId: user.id }
      }),
      
      // Delete two-factor confirmation
      db.twoFactorConfirmation.deleteMany({
        where: { userId: user.id }
      }),
      
      // Delete accounts
      db.account.deleteMany({
        where: { userId: user.id }
      }),
      
      // Finally delete the user
      db.user.delete({
        where: { id: user.id }
      })
    ]);

    // 4. Force logout after deletion
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