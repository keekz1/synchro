"use client";
import { useEffect, useState } from "react";
import { User, UserRole, ExperienceLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface MatchedUser extends User {
  matchScore: number;
  skills: string[];
  educationLevel: string[];
  experience: ExperienceLevel | null;
  age: number | null;
}

interface MatchedUsersProps {
  preference: {
    requiredSkills: string[];
    minExperience: number;
    educationLevel: string[];
    minAge: number;
    maxAge?: number;
    role: UserRole;
  };
}

const experienceToYears = (exp: ExperienceLevel | null): number => {
  switch (exp) {
    case ExperienceLevel.LESS_THAN_1_YEAR: return 0.5;
    case ExperienceLevel.ONE_TO_2_YEARS: return 1.5;
    case ExperienceLevel.THREE_TO_5_YEARS: return 4;
    case ExperienceLevel.FIVE_PLUS_YEARS: return 6;
    default: return 0;
  }
};

export const MatchedUsers = ({ preference }: MatchedUsersProps) => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatchedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      });
  
      if (!response.ok) throw new Error("Failed to fetch matched users");
  
      const data = await response.json();
  
      // Filter users to include only those with openToWork set to true
      const filteredUsers = data.users.filter((user: MatchedUser) => user.openToWork);
  
      setMatchedUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching matched users:", error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (preference.role) {
      fetchMatchedUsers();
    }
  }, [preference]);

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Matched Candidates</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMatchedUsers}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {matchedUsers.length > 0 ? (
        <div className="space-y-4">
          {matchedUsers.map((user) => {
            const experienceYears = experienceToYears(user.experience);
            return (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">
                      {user.name} ({user.matchScore}% match)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {user.email} • {experienceYears} years experience
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Skills:</span>{" "}
                    {user.skills?.join(", ")}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Education:</span>{" "}
                    {user.educationLevel?.join(", ")}
                  </p>
                  {user.age && (
                    <p className="text-sm">
                      <span className="font-medium">Age:</span> {user.age}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {loading ? "Searching for matches..." : "No matched candidates found"}
        </p>
      )}
    </div>
  );
};