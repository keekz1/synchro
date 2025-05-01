"use server";
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function DELETE() {   
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session' }, 
        { status: 401 }
      );
    }

    await db.user.delete({
      where: { id: session.user.id },
      include: {
        accounts: true  
      }
    });

    const response = NextResponse.json(
      { 
        success: true,
        message: 'Account permanently deleted'
      }, 
      { status: 200 }
    );
    
    ['next-auth.session-token', 'next-auth.csrf-token'].forEach(cookie => {
      response.cookies.set({
        name: cookie,
        value: '',
        expires: new Date(0),
        path: '/',
      });
    });

    return response;

  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete account',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 }
    );
  }
}