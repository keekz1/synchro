"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import "@/components/collab.css";
import Friends from "@/components/Friends";
import SuggestedUsers from "@/components/SuggestedUsers";
import { Prisma } from "@prisma/client";
import Notification from "@/components/Notification";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type FriendRequest = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
}

const CollabPage = () => {
  const { data: session, status } = useSession() || {};
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [realTimeRequests, setRealTimeRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [rejectedReceivers, setRejectedReceivers] = useState<Set<string>>(new Set());

  const [showFriends, setShowFriends] = useState(true);
  const [showSuggestedUsers, setShowSuggestedUsers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  // Combine API and real-time requests
  const allPendingRequests = [
    ...pendingRequests,
    ...realTimeRequests.filter(r => 
      !pendingRequests.some(pr => pr.id === r.id)
    )
  ];

  // Filter requests where user is the receiver
// In your CollabPage component
const receivedRequests = allPendingRequests.filter(
  (request) => request.receiverId === session?.user?.id && request.status === "pending"
);

  // Firestore real-time listener for pending requests
  useEffect(() => {
    if (!session?.user?.id) return;

    const q = query(
      collection(db, "users", session.user.id, "friendRequests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FriendRequest[];
      setRealTimeRequests(newRequests);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  // Fetch initial data
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [usersResponse, friendsResponse, pendingResponse] = await Promise.all([
          axios.get("/api/users").catch(() => ({ data: [] })),
          axios.get(`/api/users/${session.user.id}/friends`).catch(() => ({ data: [] })),
          axios.get(`/api/friendRequest/pending/${session.user.id}`).catch(() => ({ data: [] }))
        ]);

        setFriends(friendsResponse.data ?? []);
        setPendingRequests(pendingResponse.data ?? []);
        
        const filteredUsers = (usersResponse.data ?? []).filter(
          (user: User) => !friendsResponse.data?.some((friend: User) => friend.id === user.id)
        );
        setSuggestedUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  const handleNavbarClick = (section: string) => {
    setShowFriends(section === "friends");
    setShowSuggestedUsers(section === "suggested");
    setShowRequests(section === "requests");
  };

  const handleRequestUpdate = (requestId: string) => {
    setPendingRequests(prev => prev.filter(request => request.id !== requestId));
    setRealTimeRequests(prev => prev.filter(request => request.id !== requestId));
    axios.get(`/api/users/${session?.user?.id}/friends`).then((res) => setFriends(res.data));
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!session?.user?.id) return;
  
    try {
      const response = await axios.post("/api/friendRequest/send", {
        senderId: session.user.id,
        receiverId,
      });

      const request = response.data?.request || response.data;
      
      if (!request?.id) {
        console.error("Invalid response format:", response.data);
        throw new Error("Failed to get request ID from response");
      }

      await setDoc(doc(db, "users", receiverId, "friendRequests", request.id), {
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        status: "pending",
        sender: {
          id: request.sender?.id,
          name: request.sender?.name || '',
          email: request.sender?.email || '',
          image: request.sender?.image || null
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSentRequests(prev => new Set(prev).add(receiverId));
      toast.success("Friend request sent successfully!");
    } catch (error: unknown) {
      let errorMessage = "Failed to send friend request";
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Error sending friend request:", error);
      toast.error(errorMessage);
    }
  };

  const isRequestSentOrReceived = (userId: string) => {
    return (
      allPendingRequests.some(
        (request) => request.sender?.id === userId || request.receiver?.id === userId
      ) || sentRequests.has(userId)
    );
  };

  if (status === "loading" || !session?.user?.id) {
    return <div>Loading...</div>;
  }

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
  className={`nav-icon ${showRequests ? "active" : ""}`}
  onClick={() => handleNavbarClick("requests")}
  aria-label="Friend Requests"
>
  <div className="icon-container">
    <i className="fas fa-bell"></i>
    {receivedRequests.length > 0 && (
      <span className="notification-badge">
        {receivedRequests.length > 9 ? "9+" : receivedRequests.length}
      </span>
    )}
  </div>
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
            rejectedReceivers={rejectedReceivers}
            friends={friends}
          />
        )}
        {showRequests && (
          <Notification
            pendingRequests={receivedRequests}
            userId={session?.user?.id}
            onRequestUpdate={handleRequestUpdate}
            setFriends={setFriends}
            setRejectedReceivers={setRejectedReceivers}
          />
        )}
      </div>

      <style jsx>{`
        .notification-badge {
          position: relative;
          top: -10px;
          right: -5px;
          background-color: #f44336;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default CollabPage;