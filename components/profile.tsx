import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  skills: string[];
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [role, setRole] = useState(user.role.replace(/_/g, " ")); // Display with spaces
  const [image, setImage] = useState(user.image || "https://via.placeholder.com/100");
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rolesFromDb, setRolesFromDb] = useState<string[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/role");
        const data = await res.json();
        setRolesFromDb(data);
      } catch (error) {
        console.error("Error fetching roles", error);
        setMessage("Failed to fetch roles.");
      }
    }

    fetchRoles();
  }, []);

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
        <label htmlFor="image-upload" className="text-sm font-medium cursor-pointer text-blue-500 hover:underline">
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

      <div className="text-center mt-2">
        {isEditingRole ? (
          <div className="mt-2">
            <input
              list="role-options"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Start typing your role"
              disabled={loading}
              autoFocus
            />
            <datalist id="role-options">
              {rolesFromDb.map((r) => {
                const displayRole = r.replace(/_/g, " ");
                return <option key={r} value={displayRole} />;
              })}
            </datalist>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const selectedRole = role.trim().replace(/ /g, "_");
                  if (rolesFromDb.includes(selectedRole)) {
                    updateRole(selectedRole);
                  } else {
                    setMessage("❗ Please select a role from the list.");
                  }
                }}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingRole(false)}
                className="flex-1 bg-gray-500 text-white px-3 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-blue-500">
              Role: {role}
              <button
                onClick={() => setIsEditingRole(true)}
                className="ml-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ✏️ Edit
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-center font-semibold text-lg">Skills:</p>
        <ul className="text-center mt-2">
          {skills.map((skill, index) => (
            <li key={index} className="text-gray-700">{skill}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <label htmlFor="skill-input" className="block text-sm font-medium mb-1">
          Add Skill:
        </label>
        <div className="flex gap-2">
          <input
            id="skill-input"
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder="e.g., React, Python"
          />
          <button
            onClick={addSkill}
            disabled={loading || !newSkill.trim()}
            className="bg-blue-500 text-white px-3 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {message && <p className="text-center mt-2 text-green-500">{message}</p>}
    </div>
  );
}