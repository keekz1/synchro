// app/(protected)/settings/_components/settings-navbar.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function SettingsNavbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm text-black p-4 fixed top-0 left-0 right-0 z-40 shadow-lg border-b">
      <div className="container mx-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>
    </nav>
  );
}