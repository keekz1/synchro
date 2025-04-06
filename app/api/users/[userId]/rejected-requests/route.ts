import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID is required")
})

// Correct type signature for Next.js App Router
export async function GET(
  _request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id

    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { userId } = paramsSchema.parse(params)

    if (userId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const rejectedRequests = await db.rejectedRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      },
      orderBy: {
        rejectedAt: 'desc'
      }
    })

    return NextResponse.json(rejectedRequests)
  } catch (error) {
    console.error('Error fetching rejected requests:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}