"use server";

import { currentUser } from "@/lib/auth";
import { db as prismaDb } from "@/lib/db";  
import { logout } from "@/actions/logoutAdelete";
import { db as firestore } from "@/lib/firebase";  
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

export const deleteUser = async (reason?: string) => {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "Unauthorized" };
    }

    if (reason) {
      await prismaDb.deleteReason.create({
        data: {
          userId: user.id,
          reason: reason,
          createdAt: new Date()
        }
      });
    }

     const allFriendRequests = await prismaDb.friendRequest.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true
      }
    });

    const batch = writeBatch(firestore);

     const sentRequestsRef = collection(firestore, "users", user.id, "sentFriendRequests");
    const sentRequestsSnapshot = await getDocs(sentRequestsRef);
    sentRequestsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

     const receivedRequestsRef = collection(firestore, "users", user.id, "friendRequests");
    const receivedRequestsSnapshot = await getDocs(receivedRequestsRef);
    receivedRequestsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

     for (const request of allFriendRequests) {
       if (request.senderId === user.id) {
        const receiverRequestRef = collection(firestore, "users", request.receiverId, "friendRequests");
        const q = query(receiverRequestRef, where("id", "==", request.id));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
       else if (request.receiverId === user.id) {
        const senderRequestRef = collection(firestore, "users", request.senderId, "sentFriendRequests");
        const q = query(senderRequestRef, where("id", "==", request.id));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
    }

     const notificationsRef = collection(firestore, "users", user.id, "notifications");
    const notificationsSnapshot = await getDocs(notificationsRef);
    notificationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

     await prismaDb.$transaction([
      prismaDb.message.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      prismaDb.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      prismaDb.rejectedRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      }),
      prismaDb.friendship.deleteMany({
        where: {
          OR: [
            { userAId: user.id },
            { userBId: user.id }
          ]
        }
      }),
      prismaDb.hRPreferences.deleteMany({
        where: { userId: user.id }
      }),
      prismaDb.twoFactorConfirmation.deleteMany({
        where: { userId: user.id }
      }),
      prismaDb.account.deleteMany({
        where: { userId: user.id }
      }),
      prismaDb.user.delete({
        where: { id: user.id }
      })
    ]);

    await logout();

    return { 
      success: "Account and all related data deleted successfully",
      redirectUrl: "/auth/login"
    };

  } catch (error) {
    console.error("Complete User Deletion Error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to delete account"
    };
  }
};