 "use server";
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Optional: Get the reason from the request body
    const { reason } = await request.json();
    console.log('Deletion reason:', reason); // Log the reason or store it

    await db.$transaction([
      db.account.deleteMany({
        where: { userId: token.sub }
      }),
      db.user.delete({
        where: { id: token.sub }
      })
    ]);

    return NextResponse.json(
      { success: true, message: 'Account deleted' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Account deletion failed' },
      { status: 500 }
    );
  }
}