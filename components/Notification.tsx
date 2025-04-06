import React, { useState, useEffect } from "react";
import { Prisma } from "@prisma/client";
import axios from "axios";  // Removed AxiosError from imports
import { FaCheck, FaTimes, FaUserSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "@/lib/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot, 
  collection, 
  query, 
  where,
  setDoc
} from "firebase/firestore";
import "@/components/notifications.css";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
}

type FriendRequest = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

type RejectedRequest = Prisma.RejectedRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

interface NotificationsProps {
  userId: string;
  pendingRequests: FriendRequest[];
  onRequestUpdate: (requestId: string) => void;
  setFriends: React.Dispatch<React.SetStateAction<User[]>>;
  setRejectedReceivers: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const Notifications: React.FC<NotificationsProps> = ({
  userId,
  pendingRequests,
  onRequestUpdate,
  setFriends,
  setRejectedReceivers
}) => {
  const [rejectedRequests, setRejectedRequests] = useState<RejectedRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [realTimeRequests, setRealTimeRequests] = useState<FriendRequest[]>([]);

  // Fetch rejected requests on component mount
  useEffect(() => {
    const fetchRejectedRequests = async () => {
      try {
        const { data } = await axios.get<RejectedRequest[]>(`/api/users/${userId}/rejected-requests`);
        setRejectedRequests(data);
      } catch (error) {
        console.error("Error fetching rejected requests:", error);
      }
    };
    
    fetchRejectedRequests();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
  
    const q = query(
      collection(db, "users", userId, "friendRequests"),
      where("status", "==", "pending")
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newRequests = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FriendRequest[];
      setRealTimeRequests(newRequests);
    });
  
    return () => unsubscribe();
  }, [userId]);

  const handleAcceptFriendRequest = async (requestId: string, receiverId: string) => {
    try {
      // 1. First update in Prisma
      const { data } = await axios.post<{ request: FriendRequest }>("/api/friendRequest/accept", { requestId });
      
      // 2. Try to update Firestore
      try {
        const requestRef = doc(db, "users", receiverId, "friendRequests", requestId);
        await updateDoc(requestRef, {
          status: "accepted",
          updatedAt: serverTimestamp()
        });
      } catch (firestoreError: unknown) {
        if (firestoreError instanceof Error && 'code' in firestoreError && firestoreError.code === "not-found") {
          console.warn("Firestore document missing, recreating...");
          // Get request details from Prisma response or make another API call
          const requestDetails = data?.request || 
            (await axios.get<FriendRequest>(`/api/friendRequest/${requestId}`)).data;
          
          await setDoc(doc(db, "users", receiverId, "friendRequests", requestId), {
            id: requestId,
            senderId: requestDetails.senderId,
            receiverId: requestDetails.receiverId,
            status: "accepted",
            sender: requestDetails.sender,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          throw firestoreError;
        }
      }
  
      // 3. Update local state
      const friendsResponse = await axios.get<User[]>(`/api/users/${userId}/friends`);
      setFriends(friendsResponse.data);
      onRequestUpdate(requestId);
      
      toast.success("Friend request accepted!");
    } catch (error: unknown) {
      let errorMessage = "Failed to accept friend request";
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Error accepting friend request:", error);
      toast.error(errorMessage);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await axios.post("/api/friendRequest/reject", { requestId });
      
      const request = pendingRequests.find(r => r.id === requestId) || 
                     realTimeRequests.find(r => r.id === requestId);
  
      if (!request) {
        throw new Error("Request not found in local state");
      }
  
      if (request.receiverId) {
        try {
          const requestRef = doc(db, "users", request.receiverId, "friendRequests", requestId);
          await updateDoc(requestRef, {
            status: "rejected",
            updatedAt: serverTimestamp()
          });
        } catch (firestoreError: unknown) {
          console.warn("Firestore update failed:", firestoreError);
        }
      }
  
      setRejectedReceivers(prev => new Set(prev).add(request.senderId));
      onRequestUpdate(requestId);
      toast.success("Friend request rejected");
  
    } catch (error: unknown) {
      let errorMessage = "Failed to reject friend request";
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
  
      console.error("Request rejection failed:", error);
      toast.error(errorMessage);
    }
  };

  const handleUndoRejection = async (rejectionId: string) => {
    try {
      await axios.delete(`/api/rejected-requests/${rejectionId}`);
      
      setRejectedRequests(prev => prev.filter(r => r.id !== rejectionId));
      toast.success("Rejection undone");
    } catch (error) {
      console.error("Error undoing rejection:", error);
      toast.error("Failed to undo rejection");
    }
  };

  // Combine API and real-time requests
  const allPendingRequests = [
    ...pendingRequests,
    ...realTimeRequests.filter(r => 
      !pendingRequests.some(pr => pr.id === r.id)
    )
  ];

  return (
    <div className="notifications-container">
      <div className="notifications-tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({allPendingRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedRequests.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        <>
          <h3 className="notifications-header">Pending Requests</h3>
          {allPendingRequests.length === 0 ? (
            <p className="no-requests-message">No pending requests</p>
          ) : (
            <ul className="requests-list">
              {allPendingRequests
                .filter(request => request.receiverId === userId)
                .map((request) => (
                  <li key={request.id} className="request-item">
                    <div className="request-user-info">
                      {request.sender?.image && (
                        <img 
                          src={request.sender.image} 
                          alt={request.sender.name} 
                          className="user-avatar"
                        />
                      )}
                      <div>
                        <strong>{request.sender?.name}</strong>
                        <span className="user-email">{request.sender?.email}</span>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptFriendRequest(request.id, request.receiverId)}
                        aria-label="Accept"
                        title="Accept"
                      >
                        <FaCheck />
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectFriendRequest(request.id)}
                        aria-label="Reject"
                        title="Reject"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <h3 className="notifications-header">Rejected Requests</h3>
          {rejectedRequests.length === 0 ? (
            <p className="no-requests-message">No rejected requests</p>
          ) : (
            <ul className="requests-list">
              {rejectedRequests
                .filter(rejection => rejection.receiverId === userId && rejection.sender)
                .map((rejection) => (
                  <li key={rejection.id} className="request-item">
                    <div className="request-user-info">
                      {rejection.sender?.image && (
                        <img 
                          src={rejection.sender.image} 
                          alt={rejection.sender.name} 
                          className="user-avatar"
                        />
                      )}
                      <div>
                        <strong>{rejection.sender?.name}</strong>
                        <span className="user-email">{rejection.sender?.email}</span>
                        <small className="rejection-date">
                          Rejected on: {new Date(rejection.rejectedAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    
                    <div className="request-actions">
                      <button
                        className="undo-btn"
                        onClick={() => handleUndoRejection(rejection.id)}
                        aria-label="Undo rejection"
                        title="Undo rejection"
                      >
                        <FaUserSlash />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;