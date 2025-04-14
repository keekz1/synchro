"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Plus, Trash2, Edit, Save, X } from "lucide-react";
import {
  saveHRPreferences,
  getAllHRPreferences,
  getHRPreferenceById,
  deleteHRPreference,
  getCandidateSkillsAnalysis,
  updateHRPreferences,
} from "@/actions/hr";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Input } from "@/components/ui/input";
import { MatchedUsers } from "@/components/MatchedUsers";

// Types
type LocationPreference = "REMOTE" | "HYBRID" | "ONSITE";
type EducationLevel = "Bachelor's" | "Master's" | "PhD" | "Diploma" | "High School";

interface PreferenceSet {
  id: string;
  name: string;
  requiredSkills: string[];
  minExperience: number;
  locationType: LocationPreference;
  educationLevel: EducationLevel[];
  minAge: number;
  maxAge?: number;
  role: string;
  updatedAt: Date;
  createdAt: Date;
}

type SkillAnalysis = {
  skill: string;
  count: number;
};

type CandidateAnalysis = {
  totalCandidates: number;
  mostCommonSkills: SkillAnalysis[];
  leastCommonSkills: SkillAnalysis[];
  averageExperience?: number;
  error?: string;
};

type RoleOption = {
  value: string;
  label: string;
};
interface DbPreference {
  id: string;
  name: string;
  requiredSkills: string[];
  minExperience: number;
  locationType: string;
  educationLevel: string[];
  minAge: number | null;  // Changed from number | undefined
  maxAge: number | null;  // Changed from number | undefined
  role: string;
  updatedAt: Date;
  createdAt: Date;
  userId: string;  // Added this since it appears in the error
}
// Constants
const educationOptions: EducationLevel[] = [
  "Bachelor's",
  "Master's",
  "PhD",
  "Diploma",
  "High School",
];

// Utility Functions
const filterValidEducationLevels = (levels: string[]): EducationLevel[] => {
  return levels.filter((level): level is EducationLevel =>
    educationOptions.includes(level as EducationLevel)
  );
};

const isValidLocationType = (value: string): value is LocationPreference => {
  return ["REMOTE", "HYBRID", "ONSITE"].includes(value);
};

const transformDbPreferences = (dbPrefs: DbPreference): PreferenceSet => {
  return {
    ...dbPrefs,
    locationType: isValidLocationType(dbPrefs.locationType) ? dbPrefs.locationType : "HYBRID",
    educationLevel: filterValidEducationLevels(dbPrefs.educationLevel || []),
    minAge: dbPrefs.minAge ?? 19,
    maxAge: dbPrefs.maxAge ?? undefined
  };
};
// Main Component
const HRPage = () => {
  const role = useCurrentRole();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [preferenceSets, setPreferenceSets] = useState<PreferenceSet[]>([]);
  const [activePreference, setActivePreference] = useState<PreferenceSet | null>(null);
  const [newPreferenceName, setNewPreferenceName] = useState("");
  const [skillAnalysis, setSkillAnalysis] = useState<CandidateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPreferenceId, setEditingPreferenceId] = useState<string | null>(null);

  // Form state
  const [preferences, setPreferences] = useState({
    requiredSkills: [] as string[],
    minExperience: 1,
    locationType: "HYBRID" as LocationPreference,
    educationLevel: [] as EducationLevel[],
    minAge: 19,
    maxAge: undefined as number | undefined,
    role: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (role !== UserRole.HR) {
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
  
        // Fetch roles - fixed version
        const rolesResponse = await fetch("/api/role");
        if (!rolesResponse.ok) throw new Error("Failed to fetch roles");
        const roleStrings: string[] = await rolesResponse.json();
        
        const rolesData: RoleOption[] = roleStrings.map((role) => ({
          value: role,
          label: role.replace(/_/g, ' ')
        }));
        setRoles(rolesData);
  
        // Fetch HR preferences
        const prefResult = await getAllHRPreferences();
        if (prefResult.error) {
          toast.error(prefResult.error);
        } else if (prefResult.preferences) {
          const transformed = prefResult.preferences.map(transformDbPreferences);
          setPreferenceSets(transformed);
          if (transformed.length > 0) {
            setActivePreference(transformed[0]);
            setPreferences({
              requiredSkills: transformed[0].requiredSkills,
              minExperience: transformed[0].minExperience,
              locationType: transformed[0].locationType,
              educationLevel: transformed[0].educationLevel,
              minAge: transformed[0].minAge,
              maxAge: transformed[0].maxAge,
              role: transformed[0].role,
            });
          }
        }
  
        // Fetch candidate analysis
        const analysisResult = await getCandidateSkillsAnalysis();
        if (analysisResult?.error) {
          toast.error(analysisResult.error);
          setSkillAnalysis(null);
        } else if (analysisResult) {
          setSkillAnalysis({
            totalCandidates: analysisResult.totalCandidates || 0,
            mostCommonSkills: analysisResult.mostCommonSkills || [],
            leastCommonSkills: analysisResult.leastCommonSkills || [],
            averageExperience: analysisResult.averageExperience,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load HR data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [role]);

  const handleSkillToggle = (skill: string) => {
    setPreferences((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  const handleEducationToggle = (level: EducationLevel) => {
    setPreferences((prev) => ({
      ...prev,
      educationLevel: prev.educationLevel.includes(level)
        ? prev.educationLevel.filter((l) => l !== level)
        : [...prev.educationLevel, level],
    }));
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPreferences((prev) => ({ ...prev, role: event.target.value }));
  };

  const handleSaveNewSet = async () => {
    if (!newPreferenceName.trim()) {
      toast.error("Please enter a name for this preference set");
      return;
    }

    setLoading(true);
    try {
      const result = await saveHRPreferences({
        ...preferences,
        name: newPreferenceName
      });

      if (result.success && result.preferences) {
        const newSet = transformDbPreferences(result.preferences);
        setPreferenceSets([newSet, ...preferenceSets]);
        setActivePreference(newSet);
        setNewPreferenceName("");
        toast.success("New preference set saved!");
      }
    } catch  {
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (id: string) => {
    setLoading(true);
    try {
      const result = await deleteHRPreference(id);
      if (result.success) {
        setPreferenceSets(preferenceSets.filter(set => set.id !== id));
        if (activePreference?.id === id) {
          setActivePreference(preferenceSets[0] || null);
        }
        toast.success("Preference set deleted");
      }
    } catch  {
      toast.error("Failed to delete preference");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreference = async (id: string) => {
    setLoading(true);
    try {
      const result = await getHRPreferenceById(id);
      if (result.preference) {
        const pref = transformDbPreferences(result.preference);
        setActivePreference(pref);
        setPreferences({
          requiredSkills: pref.requiredSkills,
          minExperience: pref.minExperience,
          locationType: pref.locationType,
          educationLevel: pref.educationLevel,
          minAge: pref.minAge,
          maxAge: pref.maxAge,
          role: pref.role,
        });
      }
    } catch {
      toast.error("Failed to load preference");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (pref: PreferenceSet) => {
    setIsEditing(true);
    setEditingPreferenceId(pref.id);
    setPreferences({
      requiredSkills: pref.requiredSkills,
      minExperience: pref.minExperience,
      locationType: pref.locationType,
      educationLevel: pref.educationLevel,
      minAge: pref.minAge,
      maxAge: pref.maxAge,
      role: pref.role,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingPreferenceId(null);
    if (activePreference) {
      setPreferences({
        requiredSkills: activePreference.requiredSkills,
        minExperience: activePreference.minExperience,
        locationType: activePreference.locationType,
        educationLevel: activePreference.educationLevel,
        minAge: activePreference.minAge,
        maxAge: activePreference.maxAge,
        role: activePreference.role,
      });
    }
  };
  const handleRefresh = async () => {
    if (!activePreference) return;
    
    setLoading(true);
    try {
      const result = await getHRPreferenceById(activePreference.id);
      if (result.preference) {
        const pref = transformDbPreferences(result.preference);
        setActivePreference(pref);
        setPreferences({
          requiredSkills: pref.requiredSkills,
          minExperience: pref.minExperience,
          locationType: pref.locationType,
          educationLevel: pref.educationLevel,
          minAge: pref.minAge,
          maxAge: pref.maxAge,
          role: pref.role,
        });
        toast.success("Preferences refreshed");
      }
    } catch  {
      toast.error("Failed to refresh preferences");
    } finally {
      setLoading(false);
    }
  };
  const saveEditedPreference = async () => {
    if (!editingPreferenceId) return;

    setLoading(true);
    try {
      const result = await   updateHRPreferences(editingPreferenceId, preferences);
      if (result.success && result.preference) {
        const updatedPref = transformDbPreferences(result.preference);
        setPreferenceSets(preferenceSets.map(pref => 
          pref.id === editingPreferenceId ? updatedPref : pref
        ));
        setActivePreference(updatedPref);
        setIsEditing(false);
        setEditingPreferenceId(null);
        toast.success("Preference updated successfully");
      } else {
        toast.error(result.error || "Failed to update preference");
      }
    } catch {
      toast.error("Failed to update preference");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading HR dashboard...</p>
      </div>
    );
  }

  if (role !== UserRole.HR) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-red-500">
          🚫 You are not authorized to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Preference Sets Selector */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Your Preference Sets</h2>
            <p className="text-sm text-muted-foreground">
              {preferenceSets.length}/5 sets saved
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {preferenceSets.map((set) => (
                <div
                  key={set.id}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    activePreference?.id === set.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => handleSelectPreference(set.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{set.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {set.role} • {set.locationType}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(set);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
  
            {preferenceSets.length < 5 && (
              <div className="flex items-center gap-4">
                <Input
                  placeholder="New preference set name"
                  value={newPreferenceName}
                  onChange={(e) => setNewPreferenceName(e.target.value)}
                />
                <Button onClick={handleSaveNewSet} disabled={!preferences.role}>
                  <Plus className="mr-2 h-4 w-4" />
                  Save New Set
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
  
        {/* Current Active Preference Display */}
        {activePreference && (
          <Card id="current-preferences">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {activePreference.name} Preferences
                </h2>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(activePreference.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={saveEditedPreference}
                      disabled={loading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(activePreference)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing && editingPreferenceId === activePreference.id ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Select Candidate Role</h2>
                    <select
                      id="role"
                      value={preferences.role}
                      onChange={handleRoleChange}
                      className="w-full p-2 border rounded"
                      disabled={loading}
                      aria-label="Select candidate role"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
  
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Required Skills</h2>
                    {skillAnalysis?.mostCommonSkills?.length ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {skillAnalysis.mostCommonSkills.map(({ skill, count }) => (
                          <div key={skill} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`skill-${skill}`}
                              checked={preferences.requiredSkills.includes(skill)}
                              onChange={() => handleSkillToggle(skill)}
                              className="h-4 w-4"
                              disabled={loading}
                            />
                            <label htmlFor={`skill-${skill}`} className="text-sm">
                              {skill} ({count})
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No skills data available
                      </p>
                    )}
                  </div>
  
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Minimum Experience</h2>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={preferences.minExperience}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            minExperience: parseInt(e.target.value),
                          }))
                        }
                        className="w-full max-w-xs"
                        disabled={loading}
                        aria-label="Minimum experience"
                      />
                      <span className="text-sm font-medium">
                        {preferences.minExperience}+ years
                      </span>
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Work Location</h2>
                    <div className="flex flex-wrap gap-4">
                      {(["REMOTE", "HYBRID", "ONSITE"] as const).map((location) => (
                        <div key={location} className="flex items-center">
                          <input
                            type="radio"
                            id={`location-${location}`}
                            checked={preferences.locationType === location}
                            onChange={() =>
                              setPreferences((prev) => ({
                                ...prev,
                                locationType: location,
                              }))
                            }
                            className="h-4 w-4"
                            disabled={loading}
                          />
                          <label
                            htmlFor={`location-${location}`}
                            className="ml-2 text-sm"
                          >
                            {location.charAt(0) + location.slice(1).toLowerCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Education Level</h2>
                    <div className="flex flex-wrap gap-4">
                      {educationOptions.map((level) => (
                        <div key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`education-${level}`}
                            checked={preferences.educationLevel.includes(level)}
                            onChange={() => handleEducationToggle(level)}
                            className="h-4 w-4"
                            disabled={loading}
                          />
                          <label
                            htmlFor={`education-${level}`}
                            className="ml-2 text-sm"
                          >
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Age Range</h2>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <label htmlFor="min-age" className="text-sm">
                          Min Age:
                        </label>
                        <input
                          type="number"
                          id="min-age"
                          className="w-20 border px-2 py-1 rounded"
                          value={preferences.minAge ?? ""}
                          min="19"
                          onChange={(e) => {
                            const value = e.target.value
                              ? Math.max(19, parseInt(e.target.value))
                              : 19;
                            setPreferences((prev) => ({
                              ...prev,
                              minAge: value,
                              maxAge:
                                prev.maxAge && prev.maxAge < value
                                  ? value
                                  : prev.maxAge,
                            }));
                          }}
                          disabled={loading}
                          aria-label="Minimum age"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label htmlFor="max-age" className="text-sm">
                          Max Age:
                        </label>
                        <input
                          type="number"
                          id="max-age"
                          className="w-20 border px-2 py-1 rounded"
                          value={preferences.maxAge ?? ""}
                          min={preferences.minAge || 19}
                          onChange={(e) => {
                            const minValue = preferences.minAge || 19;
                            const value = e.target.value
                              ? Math.max(minValue, parseInt(e.target.value))
                              : undefined;
                            setPreferences((prev) => ({ ...prev, maxAge: value }));
                          }}
                          disabled={loading}
                          aria-label="Maximum age"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2">
                        <strong className="text-blue-600">Role:</strong>{" "}
                        <span className="capitalize">
                          {activePreference.role || "Not set"}
                        </span>
                      </p>
                      <p className="mb-2">
                        <strong className="text-blue-600">Experience:</strong>{" "}
                        {activePreference.minExperience}+ years
                      </p>
                      <p className="mb-2">
                        <strong className="text-blue-600">Location:</strong>{" "}
                        <span className="capitalize">
                          {activePreference.locationType.toLowerCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="mb-2">
                        <strong className="text-blue-600">Age Range:</strong>{" "}
                        {activePreference.minAge ?? 19}
                        {activePreference.maxAge ? `-${activePreference.maxAge}` : "+"}
                      </p>
                      <p className="mb-2">
                        <strong className="text-blue-600">Education:</strong>{" "}
                        {activePreference.educationLevel.length > 0
                          ? activePreference.educationLevel.join(", ")
                          : "Any"}
                      </p>
                      <p className="mb-2">
                        <strong className="text-blue-600">Required Skills:</strong>{" "}
                        {activePreference.requiredSkills.length > 0
                          ? activePreference.requiredSkills.join(", ")
                          : "None specified"}
                      </p>
                    </div>
                  </div>
  
                  {/* Matched Users Component */}
                  <MatchedUsers
                    preference={{
                      requiredSkills: activePreference.requiredSkills,
                      minExperience: activePreference.minExperience,
                      educationLevel: activePreference.educationLevel,
                      minAge: activePreference.minAge,
                      maxAge: activePreference.maxAge,
                      role: activePreference.role as UserRole,
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}
  
        {/* Create New Form */}
        {(!activePreference || !isEditing) && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">
                {activePreference ? "Create New Preference Set" : "Set Your Preferences"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Select Candidate Role</h2>
                <select
                  id="role"
                  value={preferences.role}
                  onChange={handleRoleChange}
                  className="w-full p-2 border rounded"
                  disabled={loading}
                  aria-label="Select candidate role"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
  
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Required Skills</h2>
                {skillAnalysis?.mostCommonSkills?.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {skillAnalysis.mostCommonSkills.map(({ skill, count }) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`skill-${skill}`}
                          checked={preferences.requiredSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="h-4 w-4"
                          disabled={loading}
                        />
                        <label htmlFor={`skill-${skill}`} className="text-sm">
                          {skill} ({count})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills data available
                  </p>
                )}
              </div>
  
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Minimum Experience</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={preferences.minExperience}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        minExperience: parseInt(e.target.value),
                      }))
                    }
                    className="w-full max-w-xs"
                    disabled={loading}
                    aria-label="Minimum experience"
                  />
                  <span className="text-sm font-medium">
                    {preferences.minExperience}+ years
                  </span>
                </div>
              </div>
  
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Work Location</h2>
                <div className="flex flex-wrap gap-4">
                  {(["REMOTE", "HYBRID", "ONSITE"] as const).map((location) => (
                    <div key={location} className="flex items-center">
                      <input
                        type="radio"
                        id={`location-${location}`}
                        checked={preferences.locationType === location}
                        onChange={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            locationType: location,
                          }))
                        }
                        className="h-4 w-4"
                        disabled={loading}
                      />
                      <label
                        htmlFor={`location-${location}`}
                        className="ml-2 text-sm"
                      >
                        {location.charAt(0) + location.slice(1).toLowerCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
  
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Education Level</h2>
                <div className="flex flex-wrap gap-4">
                  {educationOptions.map((level) => (
                    <div key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`education-${level}`}
                        checked={preferences.educationLevel.includes(level)}
                        onChange={() => handleEducationToggle(level)}
                        className="h-4 w-4"
                        disabled={loading}
                      />
                      <label
                        htmlFor={`education-${level}`}
                        className="ml-2 text-sm"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
  
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Age Range</h2>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="min-age" className="text-sm">
                      Min Age:
                    </label>
                    <input
                      type="number"
                      id="min-age"
                      className="w-20 border px-2 py-1 rounded"
                      value={preferences.minAge ?? ""}
                      min="19"
                      onChange={(e) => {
                        const value = e.target.value
                          ? Math.max(19, parseInt(e.target.value))
                          : 19;
                        setPreferences((prev) => ({
                          ...prev,
                          minAge: value,
                          maxAge:
                            prev.maxAge && prev.maxAge < value
                              ? value
                              : prev.maxAge,
                        }));
                      }}
                      disabled={loading}
                      aria-label="Minimum age"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="max-age" className="text-sm">
                      Max Age:
                    </label>
                    <input
                      type="number"
                      id="max-age"
                      className="w-20 border px-2 py-1 rounded"
                      value={preferences.maxAge ?? ""}
                      min={preferences.minAge || 19}
                      onChange={(e) => {
                        const minValue = preferences.minAge || 19;
                        const value = e.target.value
                          ? Math.max(minValue, parseInt(e.target.value))
                          : undefined;
                        setPreferences((prev) => ({ ...prev, maxAge: value }));
                      }}
                      disabled={loading}
                      aria-label="Maximum age"
                    />
                  </div>
                </div>
              </div>
  
              <Button
                onClick={handleSaveNewSet}
                disabled={loading || !preferences.role || !newPreferenceName}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        )}
  
        {skillAnalysis && skillAnalysis.totalCandidates > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">📊 Candidate Pool Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Insights from {skillAnalysis.totalCandidates} candidates
              </p>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Most Common Skills</h3>
                <ul className="space-y-2">
                  {skillAnalysis.mostCommonSkills.map(({ skill, count }) => (
                    <li key={skill} className="flex justify-between">
                      <span>{skill}</span>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3">Least Common Skills</h3>
                <ul className="space-y-2">
                  {skillAnalysis.leastCommonSkills.map(({ skill, count }) => (
                    <li key={skill} className="flex justify-between">
                      <span>{skill}</span>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {skillAnalysis.averageExperience !== undefined && (
                <div>
                  <h3 className="font-medium mb-3">Average Experience</h3>
                  <p>{skillAnalysis.averageExperience.toFixed(1)} years</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HRPage;