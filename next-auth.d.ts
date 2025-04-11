import NextAuth ,{type DefaultSession} from "next-auth";




export type ExtendedUser = DefaultSession ["user"]& {
    role:"Admin" |"USER"
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;


};


declare module "@auth/core" {
interface Session {

   user: ExtendedUser;

}
}