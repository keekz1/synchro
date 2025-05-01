"use server";
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function DELETE () {
  try {
     const session = await auth();
    console.log('[DELETE] Auth session:', {
      userId: session?.user?.id,
      email: session?.user?.email,
      sessionValid: !!session?.user
    });

    if (!session?.user?.id) {
      console.error('[DELETE] No valid session found');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          solution: 'Ensure you have an active session and cookies are enabled'
        }, 
        { status: 401 }
      );
    }

     console.log(`[DELETE] Starting deletion for user ${session.user.id}`);
    const deleteResult = await db.$transaction([
      db.account.deleteMany({
        where: { userId: session.user.id }
      }),
      db.user.delete({
        where: { id: session.user.id }
      })
    ]);
    console.log('[DELETE] Deletion successful:', deleteResult);

     const response = NextResponse.json(
      { 
        success: true,
        message: 'Account permanently deleted'
      },
      { status: 200 }
    );

     const authCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token'
    ];

    authCookies.forEach(cookie => {
      response.cookies.set({
        name: cookie,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: true,
        sameSite: 'none', 
        domain: process.env.NODE_ENV === 'production' 
          ? '.wesynchro.com' 
          : 'localhost'
      });
    });

    console.log('[DELETE] Session terminated and cookies cleared');
    return response;

  } catch (error) {
    console.error('[DELETE] Failure:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Account deletion failed',
        solution: 'Try again or contact support',
        ...(process.env.NODE_ENV !== 'production' && {
          debug: {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          }
        })
      },
      { status: 500 }
    );
  }
}