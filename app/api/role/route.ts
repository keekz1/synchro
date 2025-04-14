// app/api/role/route.ts
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

export const getRoles = async () => {
  try {
    const excludedRoles = ['HR', 'USER', 'ADMIN'];
    const roles = Object.values(UserRole)
      .filter(role => !excludedRoles.includes(role))
      .map(role => ({
        value: role,
        label: role.replace(/_/g, ' ')
      }));
      
    return { data: roles, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to fetch roles' };
  }
};

export async function GET() {
  const { data, error } = await getRoles();
  return error 
    ? NextResponse.json({ error }, { status: 500 })
    : NextResponse.json(data);
}