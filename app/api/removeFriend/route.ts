import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { 
  getFirestore, 
  doc, 
  deleteDoc, 
  updateDoc, 
  arrayRemove,
  collection,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { app } from "@/lib/firebase";

const requestSchema = z.object({
  friendId: z.string().min(1, "Friend ID is required")
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { friendId } = requestSchema.parse(body);

     await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId }
        ]
      }
    });

    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      }
    });

     const db = getFirestore(app);
    const chatId = [userId, friendId].sort().join('_');
    
    try {
       await deleteDoc(doc(db, "chats", chatId));
      
       const userRef = doc(db, "users", userId);
      const friendRef = doc(db, "users", friendId);
      
      await updateDoc(userRef, {
        friends: arrayRemove(friendId)
      });
      
      await updateDoc(friendRef, {
        friends: arrayRemove(userId)
      });
      
       const notificationRef = doc(collection(db, "notifications"));
      await setDoc(notificationRef, {
        type: "friend_removed",
        userIds: [userId, friendId],
        timestamp: serverTimestamp()
      });

    } catch (firestoreError) {
      console.error("Firestore update error:", firestoreError);
     }

    return NextResponse.json({
      success: true,
      message: "Friendship removed successfully"
    });

  } catch (error) {
    console.error("Error removing friendship:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data", 
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}