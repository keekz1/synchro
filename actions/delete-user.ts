"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/actions/logout";

export const deleteUser = async () => {
  try {
     const user = await currentUser();
    if (!user?.id) return { error: "Unauthorized" };

     const dbUser = await db.user.findUnique({
      where: { id: user.id }
    });
    if (!dbUser) return { error: "User not found" };

     await db.$transaction([
      db.account.deleteMany({
        where: { userId: user.id }
      }),
      db.user.delete({
        where: { id: user.id }
      })
    ]);

     await logout();

    return { success: "Account deleted successfully" };
  } catch (error) {
    console.error("Delete User Error:", error);
    return { error: "Failed to delete account" };
  }
};