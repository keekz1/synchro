import NextAuth ,{type DefaultSession} from "next-auth";




export type ExtendedUser = DefaultSession ["user"]& {
    role:"Admin" |"USER"


};


declare module "@auth/core" {
interface Session {

   user: ExtendedUser;

}
}