"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export const RoleGate = ({ children, allowedRole }: RoleGateProps) => {
  const role = useCurrentRole();

  if (role !== allowedRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-600 font-semibold">
          🚫 You are not authorized to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
