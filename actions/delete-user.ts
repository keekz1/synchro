"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const deleteUser = async (userId: string, reason: string) => {
  try {
    // Check if we're on the client side (window is defined)
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const res = await fetch(`${baseUrl}/api/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, reason }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { error: errorData.message || "Failed to delete user." };
    }

    return { success: true };
  } catch (error) {
    console.error("deleteUser error:", error);
    return { error: "Network error" };
  }
};
