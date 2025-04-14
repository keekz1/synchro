// app/api/role/route.ts
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
// app/api/role/route.ts
export async function GET() {
  try {
    const excludedRoles = [ 'USER', 'ADMIN'];
    const roles = Object.values(UserRole)
      .filter(role => !excludedRoles.includes(role))
      .map(role => role); // Just return the raw role strings
    
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}