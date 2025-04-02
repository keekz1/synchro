interface ChatHeaderProps {
  friendName: string;
  isTyping: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friendName, isTyping }) => {
  return (
    <div className="chat-header">
      <h1>{friendName}</h1>
      {isTyping && <div className="typing-indicator">Typing...</div>}
    </div>
  );
};

export default ChatHeader;
