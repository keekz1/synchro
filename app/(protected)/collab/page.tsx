"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import "@/components/collab.css";
import Friends from "@/components/Friends";
import SuggestedUsers from "@/components/SuggestedUsers";
import { Prisma } from "@prisma/client";
import Notification from "@/components/Notification";

type FriendRequest = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

const CollabPage = () => {
  const { data: session, status } = useSession();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const [showFriends, setShowFriends] = useState(true);
  const [showSuggestedUsers, setShowSuggestedUsers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const userId = session?.user?.id || null;

  // Filter requests where user is the receiver
  const receivedRequests = pendingRequests.filter(
    (request) => request.receiver?.id === userId
  );
  useEffect(() => {
    if (!userId) return;
  
    // Function to fetch both users and friends
    const fetchUsersAndFriends = async () => {
      try {
        // Start loading state
        setLoading(true);
  
        // Fetch users and friends in parallel
        const [usersResponse, friendsResponse] = await Promise.all([
          axios.get("/api/users"),
          axios.get(`/api/users/${userId}/friends`),
        ]);
  
        // Set the friends data first
        setFriends(friendsResponse.data);
  
        // Filter out users who are already friends
        const filteredUsers = usersResponse.data.filter(
          (user: User) => !friendsResponse.data.some((friend: User) => friend.id === user.id)
        );
  
        // Set the filtered suggested users
        setSuggestedUsers(filteredUsers);
  
      } catch (error) {
        console.error("Failed to fetch users or friends", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsersAndFriends();
  }, [userId]); // Only depend on userId to run this when the user logs in or changes
  

  useEffect(() => {
    if (!userId) return;

    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get(`/api/friendRequest/pending/${userId}`);
        const filteredRequests = response.data.filter(
          (request: FriendRequest) => request.receiver?.id === userId
        );
        setPendingRequests(filteredRequests);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };

    fetchPendingRequests();
  }, [userId]);

  const handleNavbarClick = (section: string) => {
    setShowFriends(section === "friends");
    setShowSuggestedUsers(section === "suggested");
    setShowRequests(section === "requests");
  };

  const handleRequestUpdate = (requestId: string) => {
    setPendingRequests(prev => prev.filter(request => request.id !== requestId));
    // Refresh friends list after accepting request
    axios.get(`/api/users/${userId}/friends`).then(res => setFriends(res.data));
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!userId) {
      alert("You must be logged in to send a friend request.");
      return;
    }
  
    // Check if the request has already been sent
    if (sentRequests.has(receiverId)) {
      alert("You have already sent a friend request to this user.");
      return;
    }
  
    try {
      await axios.post("/api/friendRequest/send", { senderId: userId, receiverId });
      alert("Friend request sent!");
      setSentRequests((prev) => new Set(prev).add(receiverId)); // Track the sent request
    } catch (err) {
      console.error("Error sending friend request:", err);
      alert("Failed to send friend request.");
    }
  };
  
  const isRequestSentOrReceived = (userId: string) => {
    return (
      pendingRequests.some((request) => request.sender?.id === userId || request.receiver?.id === userId) ||
      sentRequests.has(userId) // Check if a request was already sent
    );
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!userId) return <div>You must be logged in to access this page.</div>;

  return (
    <div className="collab-page">
      <nav className="discord-navbar">
        <a
          href="#"
          className={showFriends ? "active" : ""}
          onClick={() => handleNavbarClick("friends")}
          aria-label="Friends"
        >
          <i className="fas fa-users"></i>
        </a>
        <hr />
        <a
          href="#"
          className={showSuggestedUsers ? "active" : ""}
          onClick={() => handleNavbarClick("suggested")}
          aria-label="Suggested Users"
        >
          <i className="fas fa-user-plus"></i>
        </a>
        <a
          href="#"
          className={showRequests ? "active" : ""}
          onClick={() => handleNavbarClick("requests")}
          aria-label="Friend Requests"
        >
          <i className="fas fa-bell"></i>
          {receivedRequests.length > 0 && `(${receivedRequests.length})`}
        </a>
      </nav>

      <div className="main-content">
        {showFriends && <Friends friends={friends} loading={loading} />}
        {showSuggestedUsers && (
<SuggestedUsers
  users={suggestedUsers}
  loading={loading}
  isRequestSentOrReceived={isRequestSentOrReceived}
  sendFriendRequest={handleSendFriendRequest}
/>

        )}
        {showRequests && (
         <Notification
         pendingRequests={receivedRequests}
         userId={userId}
         onRequestUpdate={handleRequestUpdate}
         setFriends={setFriends}  // Add this line
       />
       
        )}
      </div>
    </div>
  );
};

export default CollabPage;
