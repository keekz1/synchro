import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
export async function GET() {
  try {
    const excludedRoles = [ 'USER', 'ADMIN'];
    const roles = Object.values(UserRole)
      .filter(role => !excludedRoles.includes(role))
      .map(role => role); 
    
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}