import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;  
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
