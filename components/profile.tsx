"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { ExperienceLevel } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  skills: string[];
  experience?: ExperienceLevel;
  age?: number;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  // State management
  const [role, setRole] = useState(user.role.replace(/_/g, " "));
  const [image, setImage] = useState(user.image || "https://via.placeholder.com/100");
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rolesFromDb, setRolesFromDb] = useState<string[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(user.experience);
  const [age, setAge] = useState<number | undefined>(user.age);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fetch roles on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/role");
        const data = await res.json();
        setRolesFromDb(data);
      } catch  {
        console.error("Error fetching roles");
        setMessage("Failed to fetch roles.");
      }
    }
    fetchRoles();
  }, []);

  // Profile save handler
  async function saveProfile() {
    setIsSavingProfile(true);
    setMessage("");

    try {
      const response = await fetch("/api/updatexpag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience: experience || null,
          age: age || null
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditingProfile(false);
        // Refresh user data
        const userRes = await fetch("/api/profile");
        const userData = await userRes.json();
        setExperience(userData.experience);
        setAge(userData.age);
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Role update handler
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
        setRole(newRole.replace(/_/g, " "));
        setMessage("Role updated successfully!");
        setIsEditingRole(false);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Skill add handler
  async function addSkill() {
    if (skills.includes(newSkill.trim())) {
      setMessage("This skill already exists.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/addSkill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: newSkill }),
      });

      const data = await response.json();
      if (response.ok) {
        setSkills((prevSkills) => [...prevSkills, newSkill.trim()]);
        setNewSkill("");
        setMessage("Skill added!");
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch {
      setMessage("Failed to add skill.");
    } finally {
      setLoading(false);
    }
  }

  // Image upload handler
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage("No file selected.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size exceeds 5MB limit.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImage(data.image);
        setMessage("Profile image updated!");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Display formatters
  const experienceDisplay = experience ? 
    experience.replace(/_/g, ' ').toLowerCase() : 
    "Not specified";
    
  const ageDisplay = age ? `${age} years` : "Not specified";

  return (
    <div className="p-6 rounded-xl shadow-lg w-full max-w-md mx-auto bg-gradient-to-br from-teal-400 to-teal-700 text-white">
      {/* Profile Header */}
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28 mb-4">
          <img 
            src={image} 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover border-4 border-white/20"
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <span className="text-white text-sm animate-pulse">Uploading...</span>
            </div>
          )}
        </div>

        <label className="cursor-pointer text-white hover:text-teal-200 transition-colors mb-1">
          <span className="text-sm font-medium">Change Photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            aria-label="Upload profile picture"
          />
        </label>

        <h2 className="text-2xl font-bold mt-2 text-center">{user.name}</h2>
        <p className="text-teal-100 text-sm">{user.email}</p>
      </div>

      {/* Role Section */}
      <div className="mt-6 bg-white/10 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Your Role</h3>
          {!isEditingRole && (
            <button
              onClick={() => setIsEditingRole(true)}
              className="text-teal-200 hover:text-white text-sm flex items-center"
              aria-label="Edit role"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {isEditingRole ? (
          <div className="space-y-3">
            <input
              list="role-options"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 rounded border border-teal-300 bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Select your role"
              disabled={loading}
              autoFocus
              aria-label="Select role"
            />
            <datalist id="role-options">
              {rolesFromDb.map((r) => (
                <option key={r} value={r.replace(/_/g, " ")} />
              ))}
            </datalist>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const selectedRole = role.trim().replace(/ /g, "_");
                  if (rolesFromDb.includes(selectedRole)) {
                    updateRole(selectedRole);
                  } else {
                    setMessage("Please select a valid role");
                  }
                }}
                disabled={loading}
                className="flex-1 bg-white text-teal-700 px-4 py-2 rounded-md hover:bg-teal-50 transition-colors font-medium"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingRole(false)}
                className="flex-1 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg font-medium">{role}</p>
        )}
      </div>

      {/* Profile Details Section */}
      <div className="mt-6 bg-white/10 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Profile Details</h3>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-teal-200 hover:text-white text-sm flex items-center"
              aria-label="Edit profile details"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" id="experienceLabel">
                Experience Level
              </label>
              <select
                aria-labelledby="experienceLabel"
                value={experience || ""}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                className="w-full p-2 rounded border border-teal-300 bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isSavingProfile}
                title="Select experience level"
              >
                <option value="">Select experience</option>
                <option value="LESS_THAN_1_YEAR">Less than 1 year</option>
                <option value="ONE_TO_2_YEARS">1-2 years</option>
                <option value="THREE_TO_5_YEARS">3-5 years</option>
                <option value="FIVE_PLUS_YEARS">5+ years</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" id="ageLabel">
                Age (optional)
              </label>
              <input
                type="number"
                aria-labelledby="ageLabel"
                value={age || ""}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setAge(isNaN(value) ? undefined : Math.max(18, Math.min(100, value)));
                }}
                min="0"
                max="100"
                className="w-full p-2 rounded border border-teal-300 bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter your age"
                disabled={isSavingProfile}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors font-medium"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setExperience(user.experience);
                  setAge(user.age);
                }}
                className="flex-1 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-teal-200">Experience Level</p>
              <p className="font-medium">{experienceDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-teal-200">Age</p>
              <p className="font-medium">{ageDisplay}</p>
            </div>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="mt-6 bg-white/10 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Your Skills</h3>
        
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill, index) => (
              <span 
                key={index} 
                className="bg-teal-600/50 text-white px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-teal-200 mb-4">No skills added yet</p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 p-2 rounded border border-teal-300 bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Add new skill"
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            aria-label="Add new skill"
          />
          <button
            onClick={addSkill}
            disabled={loading || !newSkill.trim()}
            className="bg-white text-teal-700 px-4 py-2 rounded-md hover:bg-teal-50 transition-colors font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mt-4 p-3 rounded-md text-center ${
          message.startsWith('Error') 
            ? 'bg-amber-100/20 text-amber-300' 
            : 'bg-teal-100/20 text-teal-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}