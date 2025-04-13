import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import "@/components/suggested.css";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

interface RejectedRequest {
  id: string;
  senderId: string;
  receiverId: string;
  rejectedAt: string;
  sender?: User;
  receiver?: User;
}

interface SuggestedUsersProps {
  users: User[];
  loading: boolean;
  isRequestSentOrReceived: (userId: string) => boolean;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  rejectedReceivers: Set<string>;
  friends?: User[];
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  users,
  loading,
  friends = [],
  isRequestSentOrReceived,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [rejectedByUsers, setRejectedByUsers] = useState<Set<string>>(new Set());
  const [usersRejectedByMe, setUsersRejectedByMe] = useState<RejectedRequest[]>([]);
  const [showRejectedList, setShowRejectedList] = useState(false);

  useEffect(() => {
    const fetchRejections = async () => {
      if (!userId) return;
      
      try {
        const response = await axios.get<RejectedRequest[]>(`/api/users/${userId}/rejected-requests`);
        
        // Rejections where I was sender (my requests got rejected)
        const rejectionSenderIds = response.data
          .filter((r) => r.senderId === userId)
          .map((r) => r.receiverId);
          
        setRejectedByUsers(new Set(rejectionSenderIds));

        // Rejections where I was receiver (users I rejected)
        const myRejections = response.data.filter((r) => r.receiverId === userId);
        setUsersRejectedByMe(myRejections);
      } catch (error) {
        console.error("Error fetching rejected requests:", error);
      }
    };

    fetchRejections();
  }, [userId]);

  const filteredUsers = users.filter((user) => {
    if (user.id === userId) return false;
    if (friends.some(friend => friend.id === user.id)) return false;
    return true;
  });

  const handleRemoveFromRejected = async (rejectedUserId: string, rejectionId: string) => {
    try {
      const response = await axios.delete(
        `/api/users/${userId}/rejected-requests`,
        { 
          data: { 
            targetUserId: rejectedUserId,
            rejectionId: rejectionId 
          } 
        }
      );
  
      if (response.data.success) {
        // Only remove the specific rejection from state
        setUsersRejectedByMe(prev => prev.filter(rejection => 
          rejection.id !== rejectionId
        ));
        toast.success("User removed from rejected list");
      }
    } catch (error) {
      console.error("Removal failed:", error);
      toast.error("Failed to remove user from rejected list");
    }
  };
  const handleSendRequest = async (receiverId: string) => {
    try {
      const response = await axios.post(
        "/api/friendRequest/send",
        { receiverId },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
  
      if (response.data.success) {
        setSentRequests(prev => new Set(prev).add(receiverId));
        toast.success(response.data.message);
      } else if (response.data.canOverride) {
        // Handle case where there's a rejection but can be overridden
        const shouldOverride = confirm(
          response.data.error + "\n\nDo you want to send the request anyway?"
        );
        
        if (shouldOverride) {
          await handleOverrideRejection(receiverId);
        }
      } else {
        toast.error(response.data.error || "Failed to send request");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403 && error.response.data?.canOverride) {
          const shouldOverride = confirm(
            error.response.data.error + "\n\nDo you want to send the request anyway?"
          );
          
          if (shouldOverride) {
            await handleOverrideRejection(receiverId);
          }
        } else {
          toast.error(error.response?.data?.error || "Failed to send friend request");
        }
      } else {
        toast.error("Failed to send friend request");
      }
    }
  };
  
  const handleOverrideRejection = async (receiverId: string) => {
    try {
      // First remove from rejected list
      await axios.delete(`/api/users/${userId}/rejected-requests`, {
        data: { 
          targetUserId: receiverId,
          override: true 
        }
      });
      
      // Then send new request
      const response = await axios.post("/api/friendRequest/send", { receiverId });
      
      if (response.data.success) {
        setSentRequests(prev => new Set(prev).add(receiverId));
        toast.success("Friend request sent!");
      }
    } catch (error) {
      toast.error("Failed to override previous rejection");
    }
  };


  if (loading) {
    return <div className="loading-indicator">Loading users...</div>;
  }

  return (
    <div className="suggested-container">
      <div className="suggested-users">
        <div className="section-header">
          <h2 className="suggested-title">Suggested Users</h2>
          {usersRejectedByMe.length > 0 && (
            <button 
              className="toggle-rejected-btn"
              onClick={() => setShowRejectedList(!showRejectedList)}
            >
              {showRejectedList ? 'Hide' : 'Show'} Rejected Users ({usersRejectedByMe.length})
            </button>
          )}
        </div>

        {showRejectedList && (
          <div className="rejected-users-section">
            <h3>Users You Rejected</h3>
            <div className="rejected-users-list">
              {usersRejectedByMe.map((rejection) => (
                <div key={rejection.id} className="rejected-user-card">
                  <div className="user-info">
                    {rejection.sender?.image && (
                      <img 
                        src={rejection.sender.image} 
                        alt={rejection.sender.name} 
                        className="user-avatar" 
                      />
                    )}
                    <div className="user-details">
                      <span className="user-name">{rejection.sender?.name}</span>
                      <span className="rejected-date">
                        Rejected on: {new Date(rejection.rejectedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="user-actions">
                  <button
  className="remove-rejected-btn"
  onClick={() => handleRemoveFromRejected(rejection.senderId, rejection.id)}
>
  Remove from Rejected
</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredUsers.length > 0 ? (
          <div className="user-cards-container">
            {filteredUsers.map((user) => {
              const hasSentRequest = sentRequests.has(user.id) || isRequestSentOrReceived(user.id);
              const wasRejectedByThisUser = rejectedByUsers.has(user.id);

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
                    {!wasRejectedByThisUser && !hasSentRequest && (
                      <button
                        className="request-button"
                        onClick={() => handleSendRequest(user.id)}
                        aria-label="Send Friend Request"
                      >
                        Add Friend
                      </button>
                    )}
                    {wasRejectedByThisUser && (
                      <span className="text-muted">Cannot send request</span>
                    )}
                    {hasSentRequest && !wasRejectedByThisUser && (
                      <span className="text-success">Request sent</span>
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
    </div>
  );
};

export default SuggestedUsers;
//.