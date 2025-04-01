import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig, User } from "next-auth";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

interface CustomUser extends User {
  id: string;
  role?: string; // Optional to avoid errors
}

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true }
      },
      async authorize(credentials) {
        console.log("🛠️ Authorizing user with credentials:", credentials);

        // Validate input fields using Zod schema
        const validateFields = LoginSchema.safeParse(credentials);
        if (!validateFields.success) {
          console.log("❌ Validation Failed:", validateFields.error);
          throw new Error("Invalid email or password");
        }

        const { email, password } = validateFields.data;

        // Fetch user from database
        const user = await getUserByEmail(email);
        if (!user || !user.password) {
          console.log("❌ No user found with that email");
          throw new Error("Invalid email or password");
        }

        // Compare passwords
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          console.log("❌ Password does not match");
          throw new Error("Invalid email or password");
        }

        console.log("✅ User authenticated:", user);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user" // Provide default role
        } as CustomUser;
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  callbacks: {
    async jwt({ token, user }) {
      console.log("🔹 JWT CALLBACK - Before:", token);
      if (user) {
        const typedUser = user as CustomUser;
        token.id = typedUser.id;
        token.email = typedUser.email;
        token.role = typedUser.role || "user"; // Provide default role
      }
      console.log("✅ JWT CALLBACK - After:", token);
      return token;
    },

    async session({ session, token }) {
      console.log("🔹 SESSION CALLBACK:", { session, token });
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.role = token.role as string;
      return session;
    }
  },

  pages: {
    signIn: "/auth/login" // Redirect users to custom login page
  },

  debug: true // Enable debug mode for better logs in Vercel
};

export default authConfig;
