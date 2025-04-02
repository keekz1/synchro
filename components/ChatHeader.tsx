interface ChatHeaderProps {
    friendId: string;
    isTyping: boolean;
  }
  
  const ChatHeader: React.FC<ChatHeaderProps> = ({ friendId, isTyping }) => {
    return (
      <div className="chat-header">
        <h1> {friendId}</h1>
        {isTyping && <div className="typing-indicator">Typing...</div>}
      </div>
    );
  };
  
  export default ChatHeader;
  