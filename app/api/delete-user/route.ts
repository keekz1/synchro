"use server";
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logout } from '@/actions/logout';

export async function DELETE( ) {
  try {
    const session = await auth();
    const response = NextResponse.json(null);

     if (!session?.user) {
      await logout();
      return response;
    }

     const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

     if (!user) {
      await logout();
      return NextResponse.json(
        { error: 'User not found - session terminated' },
        { status: 404 }
      );
    }

     await db.user.delete({ 
      where: { 
        id: user.id 
      }  
    });

     await logout();

    return NextResponse.json(
      { success: true, message: 'Account deleted and session terminated' },
      { status: 200 }
    );

  } catch  {
    console.error('Error deleting user:');
    await logout();  
    return NextResponse.json(
      { error: 'Internal server error - session terminated' },
      { status: 500 }
    );
  }
}