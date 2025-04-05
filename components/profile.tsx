"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  skills: string[];  // Add skills field
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [role, setRole] = useState(user.role);
  const [image, setImage] = useState(user.image || "https://via.placeholder.com/100");
  const [skills, setSkills] = useState<string[]>(user.skills); // Use the skills passed via props
  const [newSkill, setNewSkill] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const predefinedRoles = [
    // 🔧 Engineering & Development
    "Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer",
    "Mobile Developer", "DevOps Engineer", "Machine Learning Engineer", "AI Engineer",
    "Cloud Architect", "Site Reliability Engineer", "Embedded Systems Engineer",
    "Firmware Engineer", "Game Developer", "Security Engineer",
  
    // 🔍 Data & AI
    "Data Scientist", "Data Analyst", "Business Intelligence Analyst", "Data Engineer",
    "Research Scientist", "ML Ops Engineer", "NLP Engineer", "AI Researcher",
  
    // 🎨 Design & UX
    "UX Designer", "UI Designer", "Product Designer", "Graphic Designer",
    "Interaction Designer", "Visual Designer", "Design Researcher",
  
    // 🧠 Product & Management
    "Product Manager", "Project Manager", "Scrum Master", "Technical Program Manager",
    "Tech Lead", "Engineering Manager", "Agile Coach",
  
    // 🧪 Quality & Testing
    "QA Tester", "Test Automation Engineer", "Quality Assurance Engineer",
  
    // 💼 Business & Operations
    "Business Analyst", "Operations Manager", "Customer Success Manager",
    "Customer Support Specialist", "Sales Engineer", "Account Manager",
  
    // 🌐 Marketing & Growth
    "Marketing Specialist", "Growth Hacker", "Content Strategist",
    "SEO Specialist", "Social Media Manager", "Digital Marketing Manager",
  
    // 🖥️ IT & Infrastructure
    "System Administrator", "IT Support", "Network Engineer", "Help Desk Technician",
    "Database Administrator", "Security Analyst", "Cybersecurity Specialist",
  
    // 🧾 Writing & Documentation
    "Technical Writer", "Content Writer", "UX Writer", "Documentation Specialist",
  
    // 🎓 Academia & Research
    "Researcher", "Lecturer", "Academic Coordinator", "Education Technologist",
  
    // 🧬 Science & Bioinformatics
    "Bioinformatics Scientist", "Computational Biologist", "Medical Data Analyst",
  
    // 🍽️ Restaurant & Hospitality
    "Waiter", "Waitress", "Chef", "Sous Chef", "Line Cook", "Kitchen Assistant",
    "Restaurant Manager", "Barista", "Bartender", "Host", "Hostess",
    "Dishwasher", "Sommelier", "Pastry Chef", "Food Runner", "Catering Staff",
  
    // 🧑‍💼 Executive Roles
    "CTO", "CIO", "Chief Product Officer", "VP of Engineering", "Founder", "Co-founder",
  
    // 🧑‍💻 Freelance & Remote
    "Freelance Developer", "Remote Engineer", "Contractor",
  
    // 🌱 Entry-Level
    "Intern", "Junior Developer", "Graduate Software Engineer",
  
    // 🧠 Miscellaneous
    "Tech Enthusiast", "Hacker", "Open Source Contributor", "Mentor", "Volunteer",
    "Entrepreneur", "other"
  ];
  
  
  const isValidRole = predefinedRoles.includes(role);

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

  async function addSkill() {
    // Check if the skill already exists in the skills list
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
        // Update the skills list with the new skill
        setSkills((prevSkills) => [...prevSkills, newSkill.trim()]);
        setNewSkill(""); // Clear the input field
        setMessage("Skill added!");
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
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
    } catch (error) {
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

      {/* Display Skills */}
      <div className="mt-4">
        <p className="text-center font-semibold text-lg">Skills:</p>
        <ul className="text-center mt-2">
          {skills.map((skill, index) => (
            <li key={index} className="text-gray-700">{skill}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <label htmlFor="role-input" className="block text-sm font-medium mb-1">
          Change Role:
        </label>
        <input
          id="role-input"
          list="role-options"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Start typing your role"
          disabled={loading}
        />
        <datalist id="role-options">
          {predefinedRoles.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <button
          onClick={() => {
            const selectedRole = role.trim() === "" ? "other" : role;
            if (predefinedRoles.includes(selectedRole)) {
              updateRole(selectedRole);
            } else {
              setMessage("❗ Please select a role from the list.");
            }
          }}
          disabled={loading}
          className="mt-2 bg-blue-500 text-white px-3 py-2 rounded w-full"
        >
          Save Role
        </button>
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