"use server";

import * as z from "zod";
import { LoginSchema } from "../schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user"; // Import function to get user details
import { getUserById } from "@/data/user"; // Import function to get user by ID

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { email, password } = validatedFields.data;
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });

    // Fetch user details after successful login (using email to get userId)
    const user = await getUserByEmail(email);
    if (!user) {
      return { error: "User not found" };
    }

    // Fetch user by ID (using getUserById)
    const userDetails = await getUserById(user.id); 
    if (!userDetails) {
      return { error: "User details not found" };
    }

    return { success: true, userId: userDetails.id, user: userDetails }; // Return user details including userId

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials!" };
        default:
          return { error: "Something went wrong" };
      }
    }

    throw error;
  }
};
