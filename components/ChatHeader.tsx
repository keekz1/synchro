interface ChatHeaderProps {
  friendId: string;
  isTyping: boolean;
  friendName: string | null;  // Add friendName prop
}

const ChatHeader: React.FC<ChatHeaderProps> = ({  isTyping, friendName }) => {
  return (
    <div className="chat-header">
      <h1>{friendName || "Unknown User"}</h1> {/* Display the friend's name or "Unknown User" */}
      {isTyping && <div className="typing-indicator">Typing...</div>}
    </div>
  );
};

export default ChatHeader;
