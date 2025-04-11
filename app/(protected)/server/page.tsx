
import { UserInfo } from "@/components/user-info";
import { currentUser } from "@/lib/auth";

const ServerPage = async () =>{


const user = await currentUser();
    return (
<div className="h-screen w-full flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#99f6e4,_#134e4a)] from-teal-300 to-teal-900">


<UserInfo  
label="💻Server Component"
user={user}

/>
</div>

    );
}


export default ServerPage;