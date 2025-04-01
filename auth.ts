import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";  // This is the native Prisma adapter

import {getUserById} from "./data/user"
import {db} from "@/lib/db";
import authConfig from "@/auth.config";



export default {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🛠️ Authorize Function - Credentials Received:", credentials);

        const validateFields = LoginSchema.safeParse(credentials);
        if (!validateFields.success) {
          console.log("❌ Validation Failed:", validateFields.error);
          return null;
        }

        const { email, password } = validateFields.data;
        const user = await getUserByEmail(email);

        if (!user || !user.password) {
          console.log("❌ No user found or missing password");
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          console.log("❌ Password does not match");
          return null;
        }

        console.log("✅ User authenticated:", user);
        return user;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔹 JWT CALLBACK - Before:", token);
      if (user) token.id = user.id;
      console.log("✅ JWT CALLBACK - After:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("🔹 SESSION CALLBACK:", { session, token });
      if (token.id) session.user.id = token.id;
      return session;
    }
  },
  debug: true, // 🔥 Enable this to see logs in Vercel
};


