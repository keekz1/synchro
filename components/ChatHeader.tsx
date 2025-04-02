import React from "react";

interface ChatHeaderProps {
  friendName: string | null;
  isTyping: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friendName, isTyping }) => {
  return (
    <div className="chat-header">
      <h1>{friendName ? friendName : "Unknown User"}</h1>
      {isTyping && <div className="typing-indicator">Typing...</div>}
    </div>
  );
};

export default ChatHeader;
