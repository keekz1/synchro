import { NextResponse } from "next/server";

// Fake company knowledge base
const knowledgeBase = [
  {
    q: "what is wesynchro",
    a: "Wesynchro is a company that provides synchronization and collaboration tools for remote and hybrid teams."
  },
  {
    q: "what services does wesynchro offer",
    a: "Wesynchro offers team communication, project tracking, file synchronization, and workflow automation."
  },
  {
    q: "where is wesynchro based",
    a: "Wesynchro is headquartered in London, UK."
  },
  {
    q: "who are wesynchro's clients",
    a: "Wesynchro serves small to medium businesses, startups, and enterprises."
  },
  {
    q: "what is the mission of wesynchro",
    a: "The mission of Wesynchro is to make teamwork seamless by bridging communication gaps in remote and hybrid workplaces."
  }
];

function searchDB(query: string) {
  const lower = query.toLowerCase();
  return knowledgeBase.find((item) =>
    lower.includes(item.q.toLowerCase().split(" ")[1]) || lower.includes("wesynchro")
  );
}

export async function POST(req: Request) {
  const { message } = await req.json();

  const doc = searchDB(message);

  let reply = "Sorry, I don’t know the answer to that yet.";
  if (doc) reply = doc.a;

  return NextResponse.json({ reply });
}
