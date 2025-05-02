"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayRemove, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
import axios from "axios";
import { toast } from "sonner";
import "../components/friends.css";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface FriendsProps {
  friends: User[];
  loading: boolean;
  currentUserId: string;
  onUnfriendSuccess?: () => void;
}

const Friends: React.FC<FriendsProps> = ({ friends, loading, currentUserId, onUnfriendSuccess }) => {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isUnfriending, setIsUnfriending] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<User[]>(friends); 
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
useEffect(() => {
  if (!currentUserId) return;
  const unsubscribe = onSnapshot(doc(db, "users", currentUserId), (doc) => {
    if (doc.exists()) {
      console.log("Updated friends:", doc.data().friends);
      const updatedFriends = doc.data().friends || [];
      setFriendsList(updatedFriends);
    }
  });

  return () => unsubscribe();
}, [currentUserId]);


   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId] && 
          !menuRefs.current[openMenuId]?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const toggleMenu = (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === friendId ? null : friendId);
  };

  const handleUnfriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserId || !friendId) {
      console.error("User or Friend ID is missing:", currentUserId, friendId);
      toast.error("User or friend ID is missing. Please try again.");
      return;
    }
    
    setIsUnfriending(friendId);
    
    try {
       const currentUserRef = doc(db, "users", currentUserId);
      const friendUserRef = doc(db, "users", friendId);
      
       const response = await axios.post('/api/removeFriend', {
        friendId
      });
      
      if (response.data.success) {
        try {
           const currentUserDoc = await getDoc(currentUserRef);
          const friendUserDoc = await getDoc(friendUserRef);
          
           if (currentUserDoc.exists()) {
            await updateDoc(currentUserRef, {
              friends: arrayRemove(friendId)
            });
          } else {
            console.warn(`Current user document (${currentUserId}) doesn't exist`);
          }
          
          if (friendUserDoc.exists()) {
            await updateDoc(friendUserRef, {
              friends: arrayRemove(currentUserId)
            });
          } else {
            console.warn(`Friend user document (${friendId}) doesn't exist`);
          }
          
           try {
            const chatId = [currentUserId, friendId].sort().join('_');
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            
            if (chatDoc.exists()) {
              await deleteDoc(chatRef);
            }
          } catch (chatError) {
            console.warn("Could not delete chat:", chatError);
          }

           setFriendsList(prevFriends => prevFriends.filter(friend => friend.id !== friendId));

          toast.success("Successfully unfriended");
          if (onUnfriendSuccess) onUnfriendSuccess();
        } catch (firestoreError) {
          console.error("Firestore update error:", firestoreError);
          toast.error("Error updating friendship status in the database");
        }
      } else {
        toast.error(response.data.error || "Failed to unfriend");
      }
    } catch (error) {
      console.error("Error unfriending:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to unfriend");
      } else {
        toast.error("Failed to unfriend. Please try again.");
      }
    } finally {
      setIsUnfriending(null);
      setOpenMenuId(null);
    }
  };

  if (loading) return <p className="loading">Loading friends...</p>;

  return (
    <div className="friends-section">
      <h1 className="friends-title">Friends</h1>
      {friendsList.length === 0 ? (
        <p className="empty-message">You have no friends yet. Start adding some!</p>
      ) : (
        <ul className="friends-list">
          {friendsList.map((friend) => (
            <li key={friend.id} className="friend-item">
              <div className="friend-card" onClick={() => router.push(`/chat/${friend.id}`)}>
                <div className="friend-info">
                  <div className="friend-avatar">
                    <img 
                      src={friend.image || "https://i.imgur.com/DUC8BHW_d.png?maxwidth=520&shape=thumb&fidelity=high"} 
                      alt={friend.name} 
                      className="avatar-img" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.imgur.com/DUC8BHW_d.png?maxwidth=520&shape=thumb&fidelity=high";
                      }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(friend.id, e);
                    }}
                    disabled={isUnfriending === friend.id}
                  >
                    {isUnfriending === friend.id ? (
                      <span className="loading-spinner"></span>
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
                      ref={(el) => {
                        if (el) {
                          menuRefs.current[friend.id] = el;
                        }
                      }}
                      className="friend-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        className="menu-item unfriend-button"
                        onClick={(e) => handleUnfriend(friend.id, e)}
                        disabled={isUnfriending === friend.id}
                      >
                        {isUnfriending === friend.id ? "Unfriending..." : "Unfriend"}
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
