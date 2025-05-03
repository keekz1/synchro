"use client";

import React, { useState, useRef, useEffect  } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, onSnapshot, collection, query, where, deleteDoc } from "firebase/firestore";
import axios, { AxiosError } from "axios";
import useSWR from "swr";
import { toast } from "sonner";
import "../components/friends.css";
 
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface FriendsProps {
  currentUserId: string;
  onUnfriendSuccess?: () => void;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Friends: React.FC<FriendsProps> = ({ currentUserId, onUnfriendSuccess }) => {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isUnfriending, setIsUnfriending] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: friends, error, isLoading, mutate } = useSWR<User[]>(
    currentUserId ? `/api/users/${currentUserId}/friends` : null,
    fetcher,
    { refreshInterval: 20000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!currentUserId) return;
    const db = getFirestore();

    const userUnsub = onSnapshot(doc(db, "users", currentUserId), () => {
      mutate();
    });

    const notifQ = query(
      collection(db, "notifications"),
      where("userIds", "array-contains", currentUserId),
      where("type", "==", "friend_removed")
    );
    const notifUnsub = onSnapshot(notifQ, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          mutate();
          deleteDoc(change.doc.ref).catch(console.error);
        }
      });
    });

    return () => {
      userUnsub();
      notifUnsub();
    };
  }, [currentUserId, mutate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId]!.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleUnfriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast.error("Missing user ID");
      return;
    }
    setIsUnfriending(friendId);
    try {
      const res = await axios.post("/api/removeFriend", { friendId });
      if (res.data.success) {
        toast.success("Friend removed");
        onUnfriendSuccess?.();
      } else {
        toast.error(res.data.error || "Failed to remove friend");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to remove friend");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
    finally {
      setIsUnfriending(null);
      setOpenMenuId(null);
    }
  };

  if (isLoading) return    <div className="collab-page flex items-center justify-center h-screen">
  <i className="fas fa-spinner fa-spin text-3xl text-gray-600"></i>
</div>;
  if (error) return <p className="error">Error loading friends</p>;

  return (
    <div className="friends-section">
      <h1 className="friends-title">Friends</h1>
      {friends && friends.length === 0 ? (
        <p className="empty-message">You have no friends yet.</p>
      ) : (
        <ul className="friends-list">
          {friends?.map(friend => (
            <li key={friend.id} className="friend-item">
              <div
                className="friend-card"
                onClick={() => router.push(`/chat/${friend.id}`)}
              >
                <div className="friend-info">
                  <div className="friend-avatar">
                    <img
                      src={
                        friend.image ||
                        "https://i.imgur.com/DUC8BHW_d.png"
                      }
                      alt={friend.name}
                      className="avatar-img"
                      onError={e =>
                        (e.currentTarget.src =
                          "https://i.imgur.com/DUC8BHW_d.png")
                      }
                    />
                  </div>
                  <div className="friend-details">
                    <h2 className="friend-name">{friend.name}</h2>
                    <p className="friend-email">{friend.email}</p>
                  </div>
                </div>
                <div className="friend-actions">
                  <button
                    className="menu-button"
                    onClick={e => toggleMenu(friend.id, e)}
                    disabled={isUnfriending === friend.id}
                  >
                    {isUnfriending === friend.id ? (
                      <span className="loading-spinner" />
                    ) : (
                      <>
                        <span className="dot">•</span>
                        <span className="dot">•</span>
                        <span className="dot">•</span>
                      </>
                    )}
                  </button>
                  {openMenuId === friend.id && (
                    <div
                      ref={el => {
                        menuRefs.current[friend.id] = el || null;
                      }}
                      className="friend-menu"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="menu-item unfriend-button"
                        onClick={e => handleUnfriend(friend.id, e)}
                        disabled={isUnfriending === friend.id}
                      >
                        {isUnfriending === friend.id
                          ? "Unfriending..."
                          : "Unfriend"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Friends;
