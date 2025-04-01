import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import "@/components/suggested.css";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SuggestedUsersProps {
  users: User[];
  loading: boolean;
  isRequestSentOrReceived: (friendId: string) => boolean;
  sendFriendRequest: (friendId: string) => Promise<void>;
  friends?: User[]; // Ensure friends are passed correctly
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  users,
  loading,
  friends = [], // Default to empty array if not passed
  isRequestSentOrReceived,
  sendFriendRequest,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Load sent requests from localStorage
  const [sentRequests, setSentRequests] = useState<Set<string>>(() => {
    const savedRequests = localStorage.getItem("sentRequests");
    return savedRequests ? new Set(JSON.parse(savedRequests)) : new Set();
  });

  // Update localStorage whenever sentRequests state changes
  useEffect(() => {
    localStorage.setItem("sentRequests", JSON.stringify(Array.from(sentRequests)));
  }, [sentRequests]);

  // Filter out current user and friends from the suggested users
  const filteredUsers = users.filter(
    (user) => user.id !== userId && !friends.some((friend) => friend.id === user.id)
  );

  const handleSendRequest = async (friendId: string) => {
    if (!sentRequests.has(friendId) && !isRequestSentOrReceived(friendId)) {
      await sendFriendRequest(friendId);
      setSentRequests((prev) => {
        const updatedRequests = new Set(prev);
        updatedRequests.add(friendId);
        return updatedRequests;
      });
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="suggested-users">
      <h2 className="suggested-title">Suggested Users</h2>
      {filteredUsers.length > 0 ? (
        <div className="user-cards-container">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <button
                  className="request-button"
                  onClick={() => handleSendRequest(user.id)}
                  disabled={sentRequests.has(user.id) || isRequestSentOrReceived(user.id)}
                  aria-label={
                    sentRequests.has(user.id) || isRequestSentOrReceived(user.id)
                      ? "Request Pending"
                      : "Send Friend Request"
                  }
                >
                  {sentRequests.has(user.id) || isRequestSentOrReceived(user.id)
                    ? "✉️ Request Sent"
                    : "➕ Add Friend"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-users">No suggested users found.</p>
      )}
    </div>
  );
};

export default SuggestedUsers;
