"use server";
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    console.log('[DELETE] Start account deletion');
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('[DELETE] No session found');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log(`[DELETE] Deleting user ${session.user.id}`);
    const deleteResult = await db.user.delete({
      where: { id: session.user.id },
      include: { accounts: true }
    });
    console.log('[DELETE] User deleted:', deleteResult);

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    const cookies = ['next-auth.session-token', 'next-auth.csrf-token'];
    cookies.forEach(cookie => {
      response.cookies.set({
        name: cookie,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: 'https://wesynchro.com/'  
      });
    });

    console.log('[DELETE] Account deletion completed');
    return response;

  } catch (error) {
    console.error('[DELETE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Deletion failed',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}