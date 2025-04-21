 "use client"
import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { ExperienceLevel } from "@prisma/client";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  experience?: ExperienceLevel;
  age?: number;
  educationLevel: string[];
  openToWork: boolean;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  // State management
  const [role, setRole] = useState(user.role.replace(/_/g, " "));
  const [image, setImage] = useState(user.image || "https://via.placeholder.com/100");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rolesFromDb, setRolesFromDb] = useState<string[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(user.experience);
  const [age, setAge] = useState<number | undefined>(user.age);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [educationLevel, setEducationLevel] = useState<string[]>(user.educationLevel || []);
  const [newEducation, setNewEducation] = useState("");
  const [isOpenToWork, setIsOpenToWork] = useState(user.openToWork);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch roles
        const rolesRes = await fetch("/api/role");
        const rolesData = await rolesRes.json();
        setRolesFromDb(rolesData);

        // Fetch user profile
        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        setExperience(profileData.experience);
        setAge(profileData.age);
        setEducationLevel(profileData.educationLevel || []);
        setIsOpenToWork(profileData.openToWork);
      } catch {
        setMessage("Failed to fetch data.");
      }
    }
    fetchData();
  }, []);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setMessage("");
  
    try {
      const response = await fetch("/api/updatexpag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience: experience || null,
          age: age || null,
          educationLevel,
          openToWork: isOpenToWork
        }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditingProfile(false);
        const userRes = await fetch("/api/profile");
        const userData = await userRes.json();
        setExperience(userData.experience);
        setAge(userData.age);
        setEducationLevel(userData.educationLevel || []);
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch {
      setMessage("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateRole = async (newRole: string) => {
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
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Display formatters
  const experienceDisplay = experience ? 
    experience.replace(/_/g, ' ').toLowerCase() : 
    "Not specified";
    
  const ageDisplay = age ? `${age} years` : "Not specified";

  return (
    <div className="p-6 rounded-xl shadow-lg w-full max-w-md mx-auto bg-[radial-gradient(ellipse_at_top,_#c084fc,_#581c87)] from-purple-300 to-purple-900">
      {/* Profile Header */}
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28 mb-4">
          <Image 
            src={image} 
            alt="Profile" 
            width={112}
            height={112}
            className="w-full h-full rounded-full object-cover border-4 border-white/20"
            priority
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
  
        <h2 className="text-2xl font-bold mt-2 text-center text-white">{user.name}</h2>
        <p className="text-teal-200 text-sm">{user.email}</p>
      </div>

      {message && (
        <div className="mt-4 p-2 text-center text-white bg-teal-600 rounded">
          {message}
        </div>
      )}
  
      {/* Open to Work Toggle */}
      <div className="mt-4 bg-white/10 p-4 rounded-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-white">Open to Work</h3>
          <p className="text-sm text-teal-200">Let recruiters know you&apos;re available</p>
        </div>
        <button
          onClick={async () => {
            const newValue = !isOpenToWork;
            try {
              const response = await fetch('/api/updatexpag', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ openToWork: newValue }),
              });
  
              if (response.ok) {
                setIsOpenToWork(newValue);
              }
            } catch (error) {
              console.error('Error updating status:', error);
            }
          }}
          aria-label={isOpenToWork ? "Turn off open to work" : "Turn on open to work"}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOpenToWork ? 'bg-teal-600' : 'bg-gray-400'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isOpenToWork ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
  
      {/* Role Section */}
      <div className="mt-6 bg-white/10 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-white">Your Role</h3>
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
          <p className="text-lg font-medium text-white">{role}</p>
        )}
      </div>
  
      {/* Profile Details Section */}
      <div className="mt-6 bg-white/10 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Profile Details</h3>
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
              <label className="block text-sm font-medium text-white mb-2" id="experienceLabel">
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
              <label className="block text-sm font-medium text-white mb-2" id="ageLabel">
                Age (optional)
              </label>
              <input
  type="number"
  min={19}
  max={60}
  value={age || ""}
  onChange={(e) => setAge(Number(e.target.value))}
  className="w-full p-2 rounded border border-teal-300 bg-white text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
  placeholder="Enter your age"
  aria-label="Age"
/>

            </div>
  
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Education</label>
              {educationLevel.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {educationLevel.map((edu, index) => (
                    <div
                      key={index}
                      className="relative bg-teal-100 text-teal-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{edu}</span>
                      <button
                        onClick={() => {
                          const updated = educationLevel.filter((_, i) => i !== index);
                          setEducationLevel(updated);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
  
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add education"
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  className="w-full p-2 rounded border border-teal-300 bg-white text-teal-900"
                  list="education-options"
                />
                <datalist id="education-options">
                  <option value="High School" />
                  <option value="Associate Degree" />
                  <option value="Bachelor&apos;s Degree" />
                  <option value="Master&apos;s Degree" />
                  <option value="PhD" />
                  <option value="Diploma" />
                  <option value="Other" />
                </datalist>
                <button
                  onClick={() => {
                    if (newEducation && !educationLevel.includes(newEducation)) {
                      setEducationLevel([...educationLevel, newEducation]);
                      setNewEducation("");
                    }
                  }}
                  className="bg-white text-teal-700 px-3 rounded hover:bg-teal-100 transition"
                >
                  Add
                </button>
              </div>
            </div>
  
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="flex-1 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setExperience(user.experience);
                  setAge(user.age);
                  setEducationLevel(user.educationLevel || []);
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
              <p className="font-medium text-white">{experienceDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-teal-200">Age</p>
              <p className="font-medium text-white">{ageDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-teal-200">Education</p>
              <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                {educationLevel.map((edu, index) => (
                  <li key={index}>{edu}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}