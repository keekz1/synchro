"use client";

import { UserInfo } from "@/components/user-info";
import { useCurrentUser } from "@/hooks/use-current-user";

const ClientPage = () => {
  const user = useCurrentUser();
  return (
    <div className="mt-20 flex justify-center px-4 h-screen w-full flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#38bdf8,_#1e40af)] from-sky-400 to-blue-800">
      <UserInfo label="📱Client Component" user={user} />
    </div>
  );
};

export default ClientPage;
