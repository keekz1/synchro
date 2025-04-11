"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { SettingsSchema } from "@/schemas";
import { getUserById } from "@/data/user";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return { error: "Unauthorized" };
    }

    const dbUser = await getUserById(user.id);
    if (!dbUser) {
      return { error: "Unauthorized" };
    }

    // Handle OAuth users (restrict certain fields)
    if (user.isOAuth) {
      values.email = undefined;
      values.password = undefined;
      values.newPassword = undefined;
      values.isTwoFactorEnabled = undefined;
    }

    // Email change verification (independent of password)
    if (values.email && values.email !== user.email) {
      const existingUser = await getUserByEmail(values.email);
      if (existingUser && existingUser.id !== user.id) {
        return { error: "Email already in use" };
      }

      const verificationToken = await generateVerificationToken(values.email);
      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );
      return { success: "Verification email sent" };
    }

    // Password change logic (only if both fields are provided)
    if (values.password && values.newPassword) {
      if (!dbUser.password) {
        // For users without password (OAuth or first-time setup)
        const hashedPassword = await bcrypt.hash(values.newPassword, 10);
        values.password = hashedPassword;
        values.newPassword = undefined;
      } else {
        // For users with existing password
        const passwordsMatch = await bcrypt.compare(
          values.password,
          dbUser.password
        );
        
        if (!passwordsMatch) {
          return { error: "Incorrect current password" };
        }

        const hashedPassword = await bcrypt.hash(values.newPassword, 10);
        values.password = hashedPassword;
        values.newPassword = undefined;
      }
    } else if (values.password || values.newPassword) {
      // Only one password field provided
      return { error: "Both current and new password are required to change password" };
    }

    // Prepare update data
    const updateData: any = {
      name: values.name,
      role: values.role,
      isTwoFactorEnabled: values.isTwoFactorEnabled,
    };

    // Only include password if it was changed
    if (values.password) {
      updateData.password = values.password;
    }

    // Update user
    await db.user.update({
      where: { id: dbUser.id },
      data: updateData
    });

    return { success: "Settings Updated!" };
  } catch (error) {
    console.error("Settings Error:", error);
    return { error: "Something went wrong!" };
  }
};