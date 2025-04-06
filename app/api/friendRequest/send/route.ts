// app/api/friendRequest/send/route.ts
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Validation schema
const requestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required")
});

// Type for the response data
interface FriendRequestResponse {
  success: boolean;
  message: string;
  request: {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    sender: {
      id: string;
      name: string;
      email: string;
      image?: string | null;  // Made consistent with Prisma model
    };
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;  // Made consistent with Prisma model
  };
}

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
    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true, image: true }
    });

    if (!receiverExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing requests
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      },
      select: { 
        id: true, 
        status: true,
        senderId: true
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

    // Transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create in Prisma
      const newRequest = await tx.friendRequest.create({
        data: {
          senderId: userId,
          receiverId,
          status: "PENDING"
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      // Create in Firestore
      const requestRef = doc(db, "users", receiverId, "friendRequests", newRequest.id);
      await setDoc(requestRef, {
        id: newRequest.id,
        senderId: newRequest.senderId,
        receiverId,
        status: "pending",
        sender: {
          id: newRequest.sender.id,
          name: newRequest.sender.name,
          email: newRequest.sender.email,
          image: newRequest.sender.image ?? null // Handle undefined image
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        request: newRequest,
        receiver: receiverExists
      };
    });

    // Real-time notifications
    try {
      await Promise.all([
        // Pusher notification
        pusherServer.trigger(
          `user-${receiverId}`,
          "friend-request:new",
          {
            id: result.request.id,
            sender: {
              ...result.request.sender,
              image: result.request.sender.image ?? null // Handle undefined image
            },
            createdAt: new Date().toISOString()
          }
        ),
        
        // Firebase notification
        setDoc(doc(db, "users", receiverId, "notifications", result.request.id), {
          type: "friend-request",
          from: {
            ...result.request.sender,
            image: result.request.sender.image ?? null // Handle undefined image
          },
          createdAt: serverTimestamp(),
          read: false,
          requestId: result.request.id
        })
      ]);
    } catch (realtimeError) {
      console.error("Realtime notifications failed:", realtimeError);
    }

    // Construct the response object
    const responseData: FriendRequestResponse = {
      success: true,
      message: "Friend request sent successfully",
      request: {
        id: result.request.id,
        senderId: result.request.senderId,
        receiverId: result.request.receiverId,
        status: result.request.status,
        sender: {
          id: result.request.sender.id,
          name: result.request.sender.name,
          email: result.request.sender.email,
          image: result.request.sender.image ?? null // Handle undefined image
        }
      },
      receiver: receiverExists ? {
        id: receiverExists.id,
        name: receiverExists.name,
        email: receiverExists.email,
        image: receiverExists.image ?? null // Handle undefined image
      } : undefined
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error("Error sending friend request:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: error.errors,
          success: false
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
        stack: process.env.NODE_ENV === "development" ? (error as Error)?.stack : undefined
      },
      { status: 500 }
    );
  }
}