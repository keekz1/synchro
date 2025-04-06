// app/api/users/[userId]/rejected-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // Minimal valid implementation
    return NextResponse.json({
      userId: context.params.userId,
      message: "Success"
    });
    
  } catch  {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}