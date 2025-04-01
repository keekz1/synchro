"use client";

import useSWR from "swr";
import Profile from "@/components/profile"; // Adjust the import based on your file structure

// Fetch user data function
async function fetchUser() {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

export default function ProfilePage() {
  const { data: user, error } = useSWR("/api/profile", fetchUser);

  // Handle errors
  if (error) {
    return (
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-2xl font-bold">Profile Page</h1>
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  // Skeleton Loader
  if (!user) {
    return (
      <div className="flex flex-col items-center mt-10 space-y-4">
        <h1 className="text-2xl font-bold">Profile Page</h1>
        <div className="w-32 h-32 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-64 h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  // Render Profile component once data is fetched
  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <Profile user={user} />
    </div>
  );
}
