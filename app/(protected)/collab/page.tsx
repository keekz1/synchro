"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import axios from "axios";
import "@/components/collab.css";
import Friends from "@/components/Friends";
import SuggestedUsers from "@/components/SuggestedUsers";
import { Prisma } from "@prisma/client";
import Notification from "@/components/Notification";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCollabStore } from "@/stores/collab-store";

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

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const CollabPage = ({ fallbackData }: { fallbackData?: {
  users?: User[];
  friends?: User[];
  pendingRequests?: FriendRequest[];
} }) => {
  const { data: session, status } = useSession();
  const {
    realTimeRequests,
    sentRequests,
    rejectedReceivers,
    setRealTimeRequests,
    addSentRequest,
    removeSentRequest,
    addRejectedReceiver
  } = useCollabStore();
  const [showFriends, setShowFriends] = useState(true);
  const [showSuggestedUsers, setShowSuggestedUsers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

    // SWR hooks with fallback data
    const { data: usersData } = useSWR<User[]>('/api/users', fetcher, { 
      fallbackData: fallbackData?.users,
      revalidateIfStale: false,
      revalidateOnFocus: false
    });
  
    const { data: friendsData, mutate: mutateFriends } = useSWR<User[]>(
      session?.user?.id ? `/api/users/${session.user.id}/friends` : null, 
      fetcher,
      { 
        fallbackData: fallbackData?.friends,
        revalidateIfStale: false
      }
    );
  
    const { data: pendingData } = useSWR<FriendRequest[]>(
      session?.user?.id ? `/api/friendRequest/pending/${session.user.id}` : null,
      fetcher,
      { 
        fallbackData: fallbackData?.pendingRequests,
        revalidateIfStale: false
      }
    );
  const friends = friendsData || [];
  const pendingRequests = pendingData || [];
  const suggestedUsers = (usersData || []).filter(user => 
    !friends.some(friend => friend.id === user.id) && 
    user.id !== session?.user?.id
  );

  const allPendingRequests = [
    ...pendingRequests,
    ...realTimeRequests.filter(r => 
      !pendingRequests.some(pr => pr.id === r.id)
    )
  ];

  const receivedRequests = allPendingRequests.filter(
    (request) => request.receiverId === session?.user?.id && request.status === "pending"
  );

  // Firebase real-time listener
  useEffect(() => {
    if (!session?.user?.id) return;

    const db = getFirestore(app);
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
  }, [session?.user?.id, setRealTimeRequests]);

  const handleNavbarClick = (section: string) => {
    setShowFriends(section === "friends");
    setShowSuggestedUsers(section === "suggested");
    setShowRequests(section === "requests");
  };

  const handleRequestUpdate = async (requestId: string) => {
    setRealTimeRequests(realTimeRequests.filter(request => request.id !== requestId));
    await mutateFriends();
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!session?.user?.id) return;
  
    try {
      addSentRequest(receiverId);
      
      const response = await axios.post("/api/friendRequest/send", {
        senderId: session.user.id,
        receiverId,
      });

      const request = response.data?.request || response.data;
      
      if (!request?.id) throw new Error("Failed to get request ID");

      const db = getFirestore(app);
      await setDoc(
        doc(db, "users", receiverId, "friendRequests", request.id), 
        {
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
        }
      );

      toast.success("Friend request sent!");
    } catch (error) {
      removeSentRequest(receiverId);
      toast.error(error instanceof Error ? error.message : "Failed to send request");
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
    return (
      <div className="collab-page">
        <nav className="discord-navbar">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-nav-icon" />
          ))}
        </nav>
        <div className="main-content">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-item" />
          ))}
        </div>
      </div>
    );
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
      {showFriends && <Friends />}
      {showSuggestedUsers && (
          <SuggestedUsers
            users={suggestedUsers}
            loading={false}
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
    setRejectedReceivers={addRejectedReceiver} // Use the Zustand store action
    setFriends={() => mutateFriends()}
  />
)}
       
      </div>
    </div>
  );
};

export default CollabPage;