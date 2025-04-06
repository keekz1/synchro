import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import "@/components/suggested.css";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

interface SuggestedUsersProps {
  users: User[];
  loading: boolean;
  isRequestSentOrReceived: (friendId: string) => boolean;
  sendFriendRequest: (friendId: string) => Promise<void>;
  rejectedReceivers: Set<string>;
  friends?: User[];
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  users,
  loading,
  friends = [],
  isRequestSentOrReceived,
  rejectedReceivers,
  sendFriendRequest,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [sentRequests, setSentRequests] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("sentRequests");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [rejectedSenders, setRejectedSenders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRejectedSenders = async () => {
      if (!userId) return;

      try {
        const response = await axios.get(`/api/users/${userId}/rejected-requests`);
        const senderIds = response.data
          .filter((r: any) => r.receiverId === userId)
          .map((r: any) => r.senderId);
        setRejectedSenders(new Set(senderIds));
      } catch (error) {
        console.error("Error fetching rejected requests:", error);
      }
    };

    fetchRejectedSenders();
  }, [userId]);

  const isUserRejected = (id: string) => {
    return (rejectedReceivers?.has?.(id) ?? false) || rejectedSenders.has(id);
  };

  // Filter out current user, friends, and rejected users
  const filteredUsers = users.filter((user) => {
    // Explicitly exclude current user
    if (user.id === userId) return false;
    
    // Exclude existing friends
    if (friends.some(friend => friend.id === user.id)) return false;
    
    // Include all other users
    return true;
  });

  const handleSendRequest = async (friendId: string) => {
    if (!sentRequests.has(friendId)) {
      try {
        await sendFriendRequest(friendId);
        setSentRequests(prev => {
          const updated = new Set(prev).add(friendId);
          localStorage.setItem("sentRequests", JSON.stringify(Array.from(updated)));
          return updated;
        });
      } catch (error) {
        console.error("Failed to send friend request:", error);
      }
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading users...</div>;
  }

  return (
    <div className="suggested-users">
      <h2 className="suggested-title">Suggested Users</h2>
      {filteredUsers.length > 0 ? (
        <div className="user-cards-container">
          {filteredUsers.map((user) => {
            const isPending = sentRequests.has(user.id) || isRequestSentOrReceived(user.id);
            const isRejected = isUserRejected(user.id);

            return (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  {user.image && (
                    <img src={user.image} alt={user.name} className="user-avatar" />
                  )}
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    {user.role && <span className="user-role">{user.role}</span>}
                  </div>
                </div>

                <div className="user-actions">
                  {/* Hide the button completely if rejected */}
                  {!isRejected && !isPending && (
                    <button
                      className="request-button"
                      onClick={() => handleSendRequest(user.id)}
                      aria-label="Send Friend Request"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-users">No suggested users found.</p>
      )}
    </div>
  );
};

export default SuggestedUsers;