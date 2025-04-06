// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: {
    params: {
      userId: string;
    };
  }
): Promise<NextResponse> {
  try {
    // Basic parameter validation
    if (!context.params.userId || typeof context.params.userId !== 'string') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Your business logic here
    const data = { message: 'Success', userId: context.params.userId };
    
    return new NextResponse(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}