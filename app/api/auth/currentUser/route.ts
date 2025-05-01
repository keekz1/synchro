import { NextResponse } from 'next/server';
import { auth } from '@/auth';  
import { db } from '@/lib/db';

export async function GET() {
  try {
     const session = await auth();
    console.log("Session Data:", session);  
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

     const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
