import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string; // Add idToken here
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
