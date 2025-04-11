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

    // Handle OAuth users
    if (user.isOAuth) {
      values.email = undefined;
      values.password = undefined;
      values.newPassword = undefined;
      values.isTwoFactorEnabled = undefined;
    }

    // Email change verification
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

    // Password change logic
    if (values.password && values.newPassword && dbUser.password) {
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
    } else if (values.password || values.newPassword) {
      return { error: "Missing password fields" };
    }

    // Update user
    await db.user.update({
      where: { id: dbUser.id },
      data: {
        ...values,
      }
    });

    return { success: "Settings Updated!" };
  } catch (error) {
    console.error("Settings Error:", error);
    return { error: "Something went wrong!" };
  }
};