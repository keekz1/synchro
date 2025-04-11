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
      if (!user?.id) return { error: "Unauthorized" };
  
      const dbUser = await getUserById(user.id);
      if (!dbUser) return { error: "Unauthorized" };
  
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
        await sendVerificationEmail(verificationToken.email, verificationToken.token);
        return { success: "Verification email sent" };
      }
  
      // Prepare update data
      const updateData: any = {
        name: values.name,
        email: values.email,
        role: values.role,
        isTwoFactorEnabled: values.isTwoFactorEnabled,
      };
  
      // Only handle passwords if newPassword is provided
      if (values.newPassword && values.newPassword.trim() !== "") {
        if (!values.password || values.password.trim() === "") {
          return { error: "Current password is required" };
        }
        
        if (dbUser.password) {
          const passwordsMatch = await bcrypt.compare(values.password, dbUser.password);
          if (!passwordsMatch) return { error: "Incorrect current password" };
        }
        
        updateData.password = await bcrypt.hash(values.newPassword, 10);
      }
  
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