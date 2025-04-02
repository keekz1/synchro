interface MessageInputProps {
    newMessage: string;
    setNewMessage: React.Dispatch<React.SetStateAction<string>>;
    handleTyping: () => void;
    handleSendMessage: () => void;
  }
  
  const MessageInput: React.FC<MessageInputProps> = ({ newMessage, setNewMessage, handleTyping, handleSendMessage }) => {
    return (
      <div className="message-input-container">
        <input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage} disabled={!newMessage.trim()}>
          Send
        </button>
      </div>
    );
  };
  
  export default MessageInput;
  