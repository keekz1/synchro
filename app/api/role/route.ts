// app/api/roles/route.ts
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

export async function GET() {
  const roles = Object.values(UserRole);
  return NextResponse.json(roles);
}
