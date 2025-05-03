"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import axios from "axios";
import "@/components/collab.css";
import Friends from "@/components/Friends";
import SuggestedUsers from "@/components/SuggestedUsers";
import Notification from "@/components/Notification";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  getFirestore
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCollabStore } from "@/stores/collab-store";
import { useFirstVisitReload } from '@/hooks/first-visit';
import { Prisma } from "@prisma/client";

type FriendRequest = Prisma.FriendRequestGetPayload<{
  include: { sender: true; receiver: true };
}>;

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
  skills?: string[];
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function CollabPage() {
  useFirstVisitReload();
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
  const [showSuggested, setShowSuggested] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const userId = session?.user?.id;

  const { data: allUsers = [] } = useSWR<User[]>("/api/users", fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: false
  });

  const { data: pending = [] } = useSWR<FriendRequest[]>(
    userId ? `/api/friendRequest/pending/${userId}` : null,
    fetcher,
    { refreshInterval: 20000, revalidateOnFocus: false }
  );

  const { data: friends = [], mutate: reloadFriends } = useSWR<User[]>(
    userId ? `/api/users/${userId}/friends` : null,
    fetcher,
    { refreshInterval: 20000, revalidateOnFocus: false }
  );

  const suggestedUsers = userId
    ? allUsers.filter(u =>
        u.id !== userId && !friends.some(f => f.id === u.id)
      )
    : [];

  const allPending = [
    ...pending,
    ...realTimeRequests.filter(r => !pending.some(p => p.id === r.id))
  ];

  const receivedRequests = allPending.filter(
    r => r.receiverId === userId && r.status === "pending"
  );

  useEffect(() => {
    if (!userId) return;
    const db = getFirestore(app);
    const q = query(
      collection(db, "users", userId, "friendRequests"),
      where("status", "==", "pending")
    );
    const fetchRealtime = async () => {
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ ...(d.data() as object), id: d.id } as FriendRequest));
      setRealTimeRequests(docs);
    };
    fetchRealtime();
    const iv = setInterval(fetchRealtime, 20000);
    return () => clearInterval(iv);
  }, [userId, setRealTimeRequests]);

  const handleNav = (section: "friends" | "suggested" | "requests") => {
    setShowFriends(section === "friends");
    setShowSuggested(section === "suggested");
    setShowRequests(section === "requests");
  };

  const handleSend = async (receiverId: string) => {
    if (!userId) return;
    addSentRequest(receiverId);
    try {
      const resp = await axios.post("/api/friendRequest/send", { senderId: userId, receiverId });
      const request = resp.data.request || resp.data;
      if (!request?.id) throw new Error("No request id");
      const db = getFirestore(app);
      await setDoc(
        doc(db, "users", receiverId, "friendRequests", request.id),
        {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          status: "pending",
          sender: {
            id: request.sender.id,
            name: request.sender.name,
            email: request.sender.email,
            image: request.sender.image ?? null
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      toast.success("Friend request sent!");
    } catch (e) {
      removeSentRequest(receiverId);
      toast.error((e as Error).message || "Failed to send");
    }
  };

  const isRequested = (otherId: string) =>
    sentRequests.has(otherId) ||
    allPending.some(r => r.senderId === otherId || r.receiverId === otherId);

  const removeRealtimeRequest = (id: string) => {
    setRealTimeRequests(realTimeRequests.filter(r => r.id !== id));
  };

  if (status === "loading") {
    return (
      <div className="collab-page flex items-center justify-center h-screen">
        <i className="fas fa-spinner fa-spin text-3xl text-gray-600"></i>
      </div>
    );
  }
  

  return (
    <div className="collab-page">
      <nav className="discord-navbar">
        <a
          href="#"
          title="Friends"
          className={showFriends ? "active" : ""}
          onClick={() => handleNav("friends")}
        >
          <i className="fas fa-users" />
        </a>
        <hr />
        <a
          href="#"
          title="Suggested Users"
          className={showSuggested ? "active" : ""}
          onClick={() => handleNav("suggested")}
        >
          <i className="fas fa-user-plus" />
        </a>
        <a
          href="#"
          title="Friend Requests"
          className={showRequests ? "active" : ""}
          onClick={() => handleNav("requests")}
        >
          <i className="fas fa-bell" />
          {receivedRequests.length > 0 && (
            <span className="notification-badge">
              {receivedRequests.length > 9 ? "9+" : receivedRequests.length}
            </span>
          )}
        </a>
      </nav>

      <div className="main-content">
        {showFriends && (
          <Friends currentUserId={userId!} onUnfriendSuccess={reloadFriends} />
        )}
        {showSuggested && (
          <SuggestedUsers
            users={suggestedUsers}
            loading={false}
            friends={friends}
            isRequestSentOrReceived={isRequested}
            sendFriendRequest={handleSend}
            rejectedReceivers={rejectedReceivers}
          />
        )}
        {showRequests && (
          <Notification
            pendingRequests={receivedRequests}
            userId={userId!}
            onRequestUpdate={removeRealtimeRequest}
            setRejectedReceivers={addRejectedReceiver}
            setFriends={reloadFriends}
          />
        )}
      </div>
    </div>
  );
}
