"use client";
import { useEffect, useState } from "react";
import { User, UserRole, ExperienceLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, FileText } from "lucide-react";

interface CVData {
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MatchedUser extends User {
  matchScore: number;
  skills: string[];
  educationLevel: string[];
  preferredAreas: string[];
  experience: ExperienceLevel | null;
  age: number | null;
  openToWork: boolean;
  cv?: CVData | null;
}

interface MatchedUsersProps {
  preference: {
    requiredSkills: string[];
    minExperience: number;
    educationLevel: string[];
    minAge: number;
    maxAge?: number;
    role: UserRole;
    hiringLocation: string[];
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
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 20;

  const fetchMatchedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preference,
          hiringLocation: preference.hiringLocation || []
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch matched users");

      const data = await response.json();
      const filteredUsers = data.users.filter((user: MatchedUser) => user.openToWork);
      setMatchedUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching matched users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preference.role) fetchMatchedUsers();
  }, [preference]);

  const displayedUsers = showAll ? matchedUsers : matchedUsers.slice(0, displayLimit);

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Matched Candidates ({matchedUsers.length})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchMatchedUsers} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {displayedUsers.length > 0 ? (
        <>
          <div className="space-y-4">
            {displayedUsers.map((user) => {
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
                      {user.preferredAreas?.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Preferred locations: {user.preferredAreas.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {user.cv?.content && (
                        <a 
                          href={user.cv.content} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            View CV
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Skills:</span> {user.skills?.join(", ")}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Education:</span> {user.educationLevel?.join(", ")}
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
          
          {matchedUsers.length > displayLimit && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="mt-4"
              >
                {showAll ? 'Show Less' : `Show All (${matchedUsers.length})`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">
          {loading ? "Searching for matches..." : "No matched candidates found"}
        </p>
      )}
    </div>
  );
};