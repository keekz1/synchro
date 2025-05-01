"use server";
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    console.log('[DELETE] Starting account deletion process');
    
    // Get session using the same method as current-user endpoint
    const session = await auth();
    console.log("Session Data:", session);
    
    if (!session?.user?.email) {
      console.error('[DELETE] No authenticated session found');
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Find user by email (same as current-user endpoint)
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true } // Only need ID for deletion
    });

    if (!user) {
      console.error('[DELETE] User not found in database');
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    console.log(`[DELETE] Deleting user ID: ${user.id}`);
    
    // Perform deletion (including related accounts)
    await db.user.delete({
      where: { id: user.id },
      include: { accounts: true }
    });

    console.log('[DELETE] User successfully deleted');

    // Create response and clear cookies
    const response = NextResponse.json(
      { success: true, message: 'Account deleted' },
      { status: 200 }
    );

    // Clear auth cookies
    ['next-auth.session-token', 'next-auth.csrf-token'].forEach(cookie => {
      response.cookies.set({
        name: cookie,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.wesynchro.com' // Important: leading dot for subdomains
      });
    });

    return response;

  } catch (error) {
    console.error('[DELETE] Error during deletion:', error);
    
    return NextResponse.json(
      { 
        error: 'Account deletion failed',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}