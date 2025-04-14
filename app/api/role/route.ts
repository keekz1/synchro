// app/api/role/route.ts
import { NextResponse } from 'next/server';
import { getRoles } from '@/lib/role';

export async function GET() {
  const { data, error } = await getRoles();
  return error 
    ? NextResponse.json({ error }, { status: 500 })
    : NextResponse.json(data);
}