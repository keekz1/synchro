import React from "react";
import { Prisma } from "@prisma/client";
import axios from "axios";
import { FaCheck, FaTimes } from "react-icons/fa"; // FontAwesome icons
import "@/components/notifications.css"

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

type FriendRequest = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

interface NotificationsProps {
  userId: string;
  pendingRequests: FriendRequest[];
  onRequestUpdate: (requestId: string) => void;
  setFriends: React.Dispatch<React.SetStateAction<User[]>>;  // Add this line
}

const Notifications: React.FC<NotificationsProps> = ({
  userId,
  pendingRequests,
  onRequestUpdate,
  setFriends,
}) => {
  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      // Update pending requests first
      onRequestUpdate(requestId);

      // Accept friend request through API
      await axios.post("/api/friendRequest/accept", { requestId });

      // Fetch the updated list of friends
      const updatedFriends = await axios.get(`/api/users/${userId}/friends`);
      
      // Update the friends list
      setFriends(updatedFriends.data);

      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request.");
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      // Update pending requests first
      onRequestUpdate(requestId);

      // Reject friend request through API
      await axios.post("/api/friendRequest/reject", { requestId });

      alert("Friend request rejected!");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request.");
    }
  };

  return (
    <div className="pending-requests-modal">
      <ul>
        {pendingRequests.length === 0 ? (
          <li>No pending requests</li>
        ) : (
          pendingRequests.map((request) => {
            if (request.receiver?.id !== userId) return null;
            if (!request.sender) return null;

            return (
              <li key={request.id} className="request-item">
                <strong>{request.sender.name}</strong> sent you a friend request.
                <div className="actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    aria-label="Accept"
                  >
                    <FaCheck />
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRejectFriendRequest(request.id)}
                    aria-label="Reject"
                  >
                    <FaTimes />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default Notifications;
