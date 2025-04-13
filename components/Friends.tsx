"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "../components/friends.css"

interface User {
  id: string;
  name: string;
  email: string;
}

interface FriendsProps {
  friends: User[];
  loading: boolean;
}

const Friends: React.FC<FriendsProps> = ({ friends, loading }) => {
  const router = useRouter();

  if (loading) return <p className="loading">Loading friends...</p>;

  const openChat = (friendId: string) => {
    router.push(`/chat/${friendId}`);
  };

  return (
    <div className="friends-section">
      <h1 className="friends-title">Friends</h1>
      {friends.length === 0 ? (
        <p className="empty-message">You have no friends yet. Start adding some!</p>
      ) : (
        <ul className="friends-list">
          {friends.map((friend) => (
            <li key={friend.id} className="friend-item">
              <div className="friend-card" onClick={() => openChat(friend.id)}>
                <div className="friend-info">
                  <h2 className="friend-name">{friend.name}</h2>
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
