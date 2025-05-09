import { ExtendedUser } from "@/next-auth";
import { Card , CardHeader , CardContent} from "./ui/card";
import { Badge } from "./ui/badge";

interface UserInfoProps {
user?: ExtendedUser

label: string

};

export const UserInfo = ({ user, label}:UserInfoProps) => {

return(
<Card className="w-full max-w-[90%] md:max-w-[600px] mx-auto">

    <CardHeader className="text-2xl font-semibold text-center">
        <p>
           {label} 
        </p>

    </CardHeader>
    <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <p className="text-sm font-medium">
                ID
            </p>
            <p className="trunate text-xs max-w-[180px]
            font-mono p-1 bg-slate-100
            rounded-md">
                {user?.id}
            </p>

        </div>
        <div className="flex flex-row items-center
        justify-between rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">
                Name
            </p>
            <p className="trunate text-xs max-w-[180px]
            font-mono p-1 bg-slate-100
            rounded-md">
                {user?.name}
            </p>

        </div>
        <div className="flex flex-row items-center
        justify-between rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">
                Email
            </p>
            <p className="trunate text-xs max-w-[180px]
            font-mono p-1 bg-slate-100
            rounded-md">
                {user?.email}
            </p>

        </div>

        <div className="flex flex-row items-center
        justify-between rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">
                Role
            </p>
            <p className="trunate text-xs max-w-[180px]
            font-mono p-1 bg-slate-100
            rounded-md">
                {user?.role}
            </p>

        </div>
        <div className="flex flex-row items-center
        justify-between rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">
                Two Factor Authentication
            </p>
            <Badge variant={user?.isTwoFactorEnabled ? "success" : "destructive"}>
  {user?.isTwoFactorEnabled ? "ON" : "OFF"}
</Badge>


        </div>

    </CardContent>
</Card>

)}