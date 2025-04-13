"use client";
import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import "../components/friends.css";
import { useFriendsStore } from "@/stores/friends-store"; // New store

interface User {
  id: string;
  name: string;
  email: string;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Friends: React.FC = () => {
  const router = useRouter();
  const { friends, setFriends, loading, setLoading } = useFriendsStore();

  // SWR fetch with caching
  const { data } = useSWR<User[]>('/api/friends', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      setFriends(data);
      setLoading(false);
    },
    onError: () => setLoading(false)
  });

  const openChat = (friendId: string) => {
    router.push(`/chat/${friendId}`);
  };

  if (loading) return <p className="loading">Loading friends...</p>;

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