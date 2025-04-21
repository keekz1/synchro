"use client";

import useSWR from "swr";
import Profile from "@/components/profile"; 

async function fetchUser() {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

export default function ProfilePage() {
  const { data: user, error } = useSWR("/api/profile", fetchUser);

  if (error) {
    return (
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-2xl font-bold"></h1>
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }


  if (!user) {
    return (
<div className="h-screen w-full flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#99f6e4,_#134e4a)] from-teal-300 to-teal-900">
<h1 className="text-2xl font-bold">Profile Page</h1>
        <div className="w-32 h-32 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-64 h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold"></h1>
      <Profile user={user} />
    </div>
  );
}
