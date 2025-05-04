"use client";
import { useState, useEffect } from "react";

interface ChatHeaderProps {
  friendId: string;
  isTyping: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friendId, isTyping }) => {
  const [friendName, setFriendName] = useState<string>("Loading...");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriendName = async () => {
      try {
        const response = await fetch(`/api/getFriendname/${friendId}`);
        const data = await response.json();

        if (response.ok && data.name) {
          setFriendName(data.name);
        } else {
          setError(data.error || "Error fetching friend's name");
        }
      } catch (err) {   
        setError(`Failed to fetch friend's name: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchFriendName();
    }
  }, [friendId]);

  if (loading) {
    return <div className="chat-header">Loading...</div>;
  }

  if (error) {
    return <div className="chat-header">{error}</div>;
  }

  return (
    <div className="chat-header">
      <h1>{friendName}</h1>
      {isTyping && <div className="typing-indicator">Typing...</div>}
    </div>
  );
};

export default ChatHeader;