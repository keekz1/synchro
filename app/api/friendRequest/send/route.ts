// app/api/friendRequest/send/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

// Validation schema
const requestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required")
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        
        // Authentication check
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Validate request body
        const body = await req.json();
        const { receiverId } = requestSchema.parse(body);

        // Prevent self-request
        if (userId === receiverId) {
            return NextResponse.json(
                { error: "Cannot send friend request to yourself" },
                { status: 400 }
            );
        }

        // Validate receiver existence
        const receiverExists = await db.user.findUnique({
            where: { id: receiverId },
            select: { id: true }
        });

        if (!receiverExists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const existingRequest = await db.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId },
                    { senderId: receiverId, receiverId: userId }
                ]
            },
            select: { 
                id: true, 
                status: true,
                senderId: true,
                receiverId: true
            }
        });
        
        if (existingRequest) {
            const errorMessage = existingRequest.senderId === userId ? 
                "Friend request already sent" : 
                "This user has already sent you a request";
            
            return NextResponse.json(
                { error: errorMessage },
                { status: 409 }
            );
        }

        // Create new request
        const newRequest = await db.friendRequest.create({
            data: {
                senderId: userId,
                receiverId,
                status: "pending"
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } }
            }
        });

        // Real-time notification with error handling
        try {
            await pusherServer.trigger(
                `user-${receiverId}`,
                "friend-request:new",
                {
                    id: newRequest.id,
                    sender: newRequest.sender,
                    createdAt: newRequest.createdAt
                }
            );
        } catch (pusherError) {
            console.error("Pusher notification failed:", pusherError);
            // Consider logging to error tracking service
        }

        return NextResponse.json(
            { 
                success: true,
                message: "Friend request sent successfully",
                data: {
                    requestId: newRequest.id,
                    receiver: newRequest.receiver
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error sending friend request:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}