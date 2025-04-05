"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import SkillChart from "@/components/SkillChart";

type SkillFrequency = {
  skill: string;
  count: number;
};

type ComparisonData = {
  currentSkills: string[];
  peerSkills: string[];
  mostPopular: SkillFrequency[];
  leastPopular: SkillFrequency[];
  totalPeers: number;
};

type ComparisonResult = {
  skillsToDevelop: string[];
  uniqueSkills: string[];
  mostPopular: SkillFrequency[];
  leastPopular: SkillFrequency[];
  totalPeers: number;
  lastUpdated: string;
};

const STORAGE_KEY = "skillComparisonData";

export default function SelfGrowthPage() {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.skillsToDevelop && parsedData.lastUpdated) {
          setResult(parsedData);
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError("");

      const session = await getSession();
      if (!session?.user) {
        setError("Please sign in to view this page");
        return;
      }

      const response = await fetch("/api/skills/comparison");
      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }

      const data: ComparisonData = await response.json();
      
      const currentSkills = data.currentSkills;
      const peerSkills = data.peerSkills;

      const skillsToDevelop = peerSkills.filter(
        skill => !currentSkills.includes(skill)
      );
      
      const uniqueSkills = currentSkills.filter(
        skill => !peerSkills.includes(skill)
      );

      const newResult = {
        skillsToDevelop,
        uniqueSkills,
        mostPopular: data.mostPopular,
        leastPopular: data.leastPopular,
        totalPeers: data.totalPeers,
        lastUpdated: new Date().toLocaleString()
      };

      setResult(newResult);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newResult));

    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!result) return [];
  
    const skillCountMap: Record<string, { count: number; type: 'popular' | 'rare' }> = {};
  
    const processSkills = (
      data: SkillFrequency[],
      type: 'popular' | 'rare'
    ) => {
      for (const item of data) {
        const splitSkills = item.skill
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
  
        for (const skill of splitSkills) {
          if (!skillCountMap[skill]) {
            skillCountMap[skill] = { count: 0, type };
          }
          skillCountMap[skill].count += item.count;
        }
      }
    };
  
    processSkills(result.mostPopular, 'popular');
    processSkills(result.leastPopular, 'rare');
  
    return Object.entries(skillCountMap).map(([skill, { count, type }]) => ({
      skill,
      count,
      type
    }));
  };

  const toggleSkillsExpand = () => {
    setSkillsExpanded(!skillsExpanded);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Skill Development Insights</h1>
        <button
          onClick={fetchComparisonData}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Refresh Analysis'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {result ? (
        <>
          <div className="text-gray-600">
            <p>Compared with {result.totalPeers} peers in your role</p>
            <p className="text-sm text-gray-500">
              Last updated: {result.lastUpdated}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <button 
                onClick={toggleSkillsExpand}
                className="w-full text-left"
              >
                <h2 className="text-xl font-semibold mb-4 text-blue-600 flex justify-between items-center">
                  <span>Skills to Develop</span>
                  <span className="text-gray-500 text-sm">
                    {skillsExpanded ? '▲' : '▼'}
                  </span>
                </h2>
              </button>
              
              {skillsExpanded && (
                result.skillsToDevelop.length ? (
                  <ul className="space-y-2">
                    {result.skillsToDevelop.map((skill, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-4 h-4 bg-blue-100 rounded-full mr-2 flex-shrink-0"></span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">
                    You have all the skills common in your role!
                  </p>
                )
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600">
                Your Unique Skills
              </h2>
              {result.uniqueSkills.length ? (
                <ul className="space-y-2">
                  {result.uniqueSkills.map((skill, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-4 h-4 bg-green-100 rounded-full mr-2 flex-shrink-0"></span>
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">
                  No unique skills compared to your peers
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Skill Popularity in Your Role</h2>
            <div className="h-[500px]">
              <SkillChart data={getChartData()} />
            </div>
            <div className="flex justify-center mt-4 space-x-4">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span>Common Skills</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Rare Skills</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Ready for your skill analysis</h2>
          <p className="text-gray-600 mb-4">
            {loading ? 'Loading your analysis...' : 'Get your personalized skill comparison'}
          </p>
          {!loading && (
            <button
              onClick={fetchComparisonData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Run Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
}