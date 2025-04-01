"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [role, setRole] = useState(user.role);
  const [image, setImage] = useState(user.image || "https://via.placeholder.com/100");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updateRole(newRole: string) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/updateRole", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });

      const data = await response.json();
      if (response.ok) {
        setRole(newRole);
        setMessage("Role updated successfully!");
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch  {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage("No file selected.");
      return;
    }
  
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
  
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size exceeds 5MB limit.");
      return;
    }
  
    setLoading(true);
    setMessage("");
  
    const formData = new FormData();
    formData.append("image", file);
  
    console.log("Uploading file:", file.name, file.type, file.size); // 🛠️ Debugging
  
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      console.log("Upload response:", data); // 🛠️ Debugging
  
      if (response.ok) {
        setImage(data.image);
        setMessage("Profile image updated!");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="p-4 border rounded shadow-md w-96">
      <div className="relative mx-auto w-24 h-24">
        <img src={image} alt="Profile" className="w-full h-full rounded-full object-cover" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
            <span className="text-gray-700 text-sm">Uploading...</span>
          </div>
        )}
      </div>

      <div className="text-center mt-2">
        <label
          htmlFor="image-upload"
          className="text-sm font-medium cursor-pointer text-blue-500 hover:underline"
        >
          Change Profile Picture
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <h2 className="text-xl font-semibold text-center mt-2">{user.name}</h2>
      <p className="text-center text-gray-600">{user.email}</p>
      <p className="text-center text-blue-500">Role: {role}</p>

      <div className="mt-4">
        <label htmlFor="role-select" className="block text-sm font-medium">
          Change Role:
        </label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => updateRole(e.target.value)}
          className="w-full border rounded p-2 mt-1"
          disabled={loading}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {message && <p className="text-center mt-2 text-green-500">{message}</p>}
    </div>
  );
}
