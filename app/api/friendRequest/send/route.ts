import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const requestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required")
});

interface FriendRequestResponse {
  success: boolean;
  message: string;
  request?: {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    sender: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { receiverId } = requestSchema.parse(body);

    // Basic validations
    if (userId === receiverId) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Check if receiver exists
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

    // Check for existing requests first (before checking rejections)
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
      return NextResponse.json(
        {
          success: false,
          message: existingRequest.senderId === userId ? 
            "Friend request already sent" : 
            "This user has already sent you a request",
          existingRequest: {
            id: existingRequest.id,
            status: existingRequest.status
          }
        },
        { status: 200 }
      );
    }

    // Check for active rejections (only if no existing request)
    const activeRejection = await prisma.rejectedRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      }
    });

    if (activeRejection) {
      return NextResponse.json(
        { 
          success: false,
          error: activeRejection.senderId === userId ?
            "You previously rejected this user" :
            "This user previously rejected you",
          canOverride: true
        },
        { status: 403 }
      );
    }

    // Transaction for creating new request
    const result = await prisma.$transaction(async (tx) => {
      // Create new request
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

      // Update Firestore - both in friendRequests and notifications
      const requestRef = doc(db, "users", receiverId, "friendRequests", newRequest.id);
      const notificationRef = doc(db, "users", receiverId, "notifications", newRequest.id);
      
      const requestData = {
        id: newRequest.id,
        senderId: newRequest.senderId,
        receiverId,
        status: "pending",
        sender: {
          id: newRequest.sender.id,
          name: newRequest.sender.name,
          email: newRequest.sender.email,
          image: newRequest.sender.image ?? null
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await Promise.all([
        setDoc(requestRef, requestData),
        setDoc(notificationRef, {
          ...requestData,
          type: "friend-request",
          read: false
        })
      ]);

      return {
        request: newRequest,
        receiver: receiverExists
      };
    });

    // Real-time notifications
    try {
      const pusherPayload = {
        id: result.request.id,
        sender: {
          ...result.request.sender,
          image: result.request.sender.image ?? null
        },
        createdAt: new Date().toISOString(),
        type: "friend-request"
      };

      await Promise.all([
        pusherServer.trigger(`user-${receiverId}`, "friend-request:new", pusherPayload),
        pusherServer.trigger(`presence-${receiverId}`, "friend-request:new", pusherPayload)
      ]);
    } catch (realtimeError) {
      console.error("Realtime notifications failed:", realtimeError);
      // Not failing the request - just logging the error
    }

    // Success response
    return NextResponse.json({
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
          image: result.request.sender.image ?? null
        }
      },
      receiver: {
        id: receiverExists.id,
        name: receiverExists.name,
        email: receiverExists.email,
        image: receiverExists.image ?? null
      }
    }, { status: 201 });

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