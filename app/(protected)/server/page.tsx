
import { UserInfo } from "@/components/user-info";
import { currentUser } from "@/lib/auth";

const ServerPage = async () =>{


const user = await currentUser();
    return (
        <div className="mt-20 flex justify-center px-4 h-screen w-full flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#38bdf8,_#1e40af)] from-sky-400 to-blue-800">


<UserInfo  
label="💻Server Component"
user={user}

/>
</div>

    );
}


export default ServerPage;