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
    // Your business logic here
    const data = { 
      userId: context.params.userId,
      message: "Working route handler"
    };
    
    return NextResponse.json(data, { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json' 
      } 
    });

  } catch  {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}