"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { ExperienceLevel } from "@prisma/client";
import Image from "next/image";
import { getStorage, ref, uploadBytes, getDownloadURL  } from "firebase/storage";
import { app } from "@/lib/firebase";  
 
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
  skills: string[];
  cv?: {
    content?: string;   

    fileUrl: string;
    fileName: string;
    fileSize: number;
  };
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [role, setRole] = useState(user.role.replace(/_/g, " "));
  const [image, setImage] = useState(user.image || "/images/cat.png");
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
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [userCV, setUserCV] = useState<{
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  } | null>(user.cv || null);
  useEffect(() => {
    async function fetchData() {
      try {
        const rolesRes = await fetch("/api/role");
        const rolesData = await rolesRes.json();
        setRolesFromDb(rolesData);

        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        setExperience(profileData.experience);
        setAge(profileData.age);
        setEducationLevel(profileData.educationLevel || []);
        setIsOpenToWork(profileData.openToWork);
        setSkills(profileData.skills || []);
        
         if (profileData.cv) {
          setUserCV(profileData.cv);
        }
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
          openToWork: isOpenToWork,
          skills
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditingProfile(false);
        window.location.reload();

        setExperience(data.experience);
        setAge(data.age);
        setEducationLevel(data.educationLevel || []);
        setIsOpenToWork(data.openToWork);
        setSkills(data.skills || []);
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
        window.location.reload();
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

  const handleCVUpload = async () => {
    if (!cvFile) return;
  
    setIsUploadingCV(true);
    setMessage("");
  
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session?.user?.id) {
        throw new Error("You must be logged in to upload a CV");
      }
  
      const storage = getStorage(app);
      const storageRef = ref(storage, `cvs/${session.user.id}/${cvFile.name}`);
      
      const metadata = {
        contentType: 'application/pdf',  
        customMetadata: {
          uploadedBy: session.user.id,
          originalName: cvFile.name
        }
      };
  
       const uploadTask = await uploadBytes(storageRef, cvFile, metadata);
      const downloadURL = await getDownloadURL(uploadTask.ref);
  
       const response = await fetch("/api/upload-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: downloadURL,
          fileName: cvFile.name,
          fileSize: cvFile.size
        }),
        credentials: "include"
      });
  
      if (!response.ok) {
        throw new Error("Failed to save CV record");
      }
  
       setUserCV({
        fileUrl: downloadURL,
        fileName: cvFile.name,
        fileSize: cvFile.size
      });
  
      setMessage("CV uploaded successfully!");
      setCvFile(null);
  
    } catch   {
      setMessage(  "Failed to upload CV");
      console.error("Upload error: ");
    } finally {
      setIsUploadingCV(false);
    }
  };

  const addSkill = async (skill: string) => {
    try {
      const response = await fetch('/api/addSkill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setSkills([...skills, skill.trim()]);
        setNewSkill("");
        setMessage("Skill added successfully");
      } else {
        setMessage(data.message || "Failed to add skill");
      }
    } catch  {
      setMessage("Failed to add skill");
    }
  };

  const removeSkill = async (skill: string) => {
    try {
      const response = await fetch('/api/removeSkill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setSkills(skills.filter(s => s !== skill));
        setMessage("Skill removed successfully");
      } else {
        setMessage(data.message || "Failed to remove skill");
      }
    } catch  {
      setMessage("Failed to remove skill");
    }
  };

  const experienceDisplay = experience ? 
    experience.replace(/_/g, ' ').toLowerCase() : 
    "Not specified";
    
  const ageDisplay = age ? `${age} years` : "Not specified";

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      {/* Profile Header Section */}
      <div className="text-center mb-8">
        <div className="relative inline-block group">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
            <Image
              src={image}
              alt="Profile"
              width={128}
              height={128}
              className="w-full h-full object-cover"
              priority
            />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
            <Pencil className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              aria-label="Upload profile picture"
            />
          </label>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-gray-600">{user.email}</p>
      </div>

      {/* status message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes("Failed") ? 
          'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
        }`}>
          {message}
        </div>
      )}

      {/* Opentowork */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Employment Status</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isOpenToWork ? "Actively seeking opportunities" : "Not currently looking"}
            </p>
          </div>
          <button
            onClick={() => setIsOpenToWork(!isOpenToWork)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              isOpenToWork ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={isOpenToWork ? 'Set as not open to work' : 'Set as open to work'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOpenToWork ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Role  */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Professional Role</h2>
          {!isEditingRole && (
            <button
              onClick={() => setIsEditingRole(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
          )}
        </div>
        
        {isEditingRole ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                list="role-options"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select your role"
              />
              <datalist id="role-options" className="w-full">
                {rolesFromDb.map((r) => (
                  <option key={r} value={r.replace(/_/g, " ")} />
                ))}
              </datalist>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updateRole(role.trim().replace(/ /g, "_"))}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditingRole(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">{role}</p>
        )}
      </section>

      {/* Profile details*/}
      <section className="border-t border-gray-100 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Professional Details</h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="space-y-6">
            {/* Experience and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  aria-label="Experience Level"
                  value={experience || ""}
                  onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select experience</option>
                  <option value="LESS_THAN_1_YEAR">Less than 1 year</option>
                  <option value="ONE_TO_2_YEARS">1-2 years</option>
                  <option value="THREE_TO_5_YEARS">3-5 years</option>
                  <option value="FIVE_PLUS_YEARS">5+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  min={19}
                  max={60}
                  value={age || ""}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Education  */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Education</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add education level"
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    list="education-options"
                  />
                  <button
                    onClick={() => {
                      if (newEducation && !educationLevel.includes(newEducation)) {
                        setEducationLevel([...educationLevel, newEducation]);
                        setNewEducation("");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {educationLevel.map((edu, index) => (
                    <div key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                      <span>{edu}</span>
                      <button
                        onClick={() => setEducationLevel(educationLevel.filter((_, i) => i !== index))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills   */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Skills</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (newSkill && !skills.includes(newSkill)) {
                        addSkill(newSkill);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2">
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CV   */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">CV / Resume</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              {userCV ? (
  <div className="flex flex-col gap-4">
    {/* File infos and actions */}
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <a
          href={userCV.fileUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 truncate font-medium text-sm"
          title={userCV.fileName}
        >
          {userCV.fileName || 'My CV'}
        </a>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (userCV.fileUrl) {
              const link = document.createElement('a');
              link.href = userCV.fileUrl;
              link.download = userCV.fileName || "CV.pdf";
              link.click();
            }
          }}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          disabled={!userCV.fileUrl}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Replace
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>
    </div>
    
    {/* PDF preview */}
    {userCV.fileUrl ? (
      <div className="w-full h-96 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
        {userCV.fileUrl.includes('firebasestorage.googleapis.com') ? (
          <iframe 
            src={`${userCV.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full"
            title="CV Preview"
            onError={() => setMessage("Failed to load PDF preview. Try downloading the file instead.")}
          />
        ) : (
        <iframe
            src={`${userCV.fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full"
            title="CV Preview"
          />
        )}
      </div>
    ) : (
      <div className="p-4 text-center text-gray-500">
        PDF preview not available
      </div>
    )}
  </div>
) : (
  <div className="flex flex-col items-center">
    <div className="mb-3 text-gray-500">
      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
    </div>
    <label className="cursor-pointer flex flex-col items-center">
      <span className="text-blue-600 font-medium">Upload your CV</span>
      <span className="text-gray-500 text-sm mt-1">PDF format, max 5MB</span>
      <input
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
      />
    </label>
  </div>
)}
                {cvFile && (
                  <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="truncate">{cvFile.name}</span>
                    <button
                      onClick={handleCVUpload}
                      disabled={isUploadingCV}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      {isUploadingCV ? 'Uploading...' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isSavingProfile ? 'Saving...' : 'Save All Changes'}
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Experience Level</h3>
              <p className="text-gray-900">{experienceDisplay}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Age</h3>
              <p className="text-gray-900">{ageDisplay}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Education</h3>
              <div className="flex flex-wrap gap-2">
                {educationLevel.map((edu, index) => (
                  <span key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {edu}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {/* CV view*/}
            {userCV && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">CV / Resume</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <a
                      href={userCV.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {userCV.fileName}
                    </a>
                    
                  </div>
                  <div className="w-full h-64 bg-gray-50 rounded-lg overflow-hidden">
                  {user.cv?.content ? (
    <iframe 
      src={`https://docs.google.com/viewer?url=${encodeURIComponent(user.cv.content)}&embedded=true`}
    className="w-full h-full"
    title="CV Preview"
  />
  ) : (
    <div className="flex items-center justify-center h-full text-gray-500">
      No CV available for preview
    </div>
  )}
</div>               </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}