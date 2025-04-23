import React, { useState } from "react";
import { QuerySnapshot, QueryDocumentSnapshot, DocumentData, Timestamp } from "firebase/firestore";

interface Message {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  status: string;
}

interface MessagesContainerProps {
  messagesSnapshot: QuerySnapshot<DocumentData> | null | undefined;
  userId: string | null;
  onDeleteMessage: (messageId: string) => void;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ 
  messagesSnapshot, 
  userId,
  onDeleteMessage 
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  if (!messagesSnapshot) {
    return <div className="messages-container">No messages found</div>;
  }

  return (
    <div className="messages-container">
      {messagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const message = doc.data() as Message;
        const isSender = message.senderId === userId;
        const timestamp = message.createdAt?.toDate?.();
        const timeString = timestamp?.toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit" 
        });

        return (
          <div 
            key={doc.id} 
            className={`message ${isSender ? "sent" : "received"}`}
            onClick={() => isSender && setSelectedMessageId(doc.id)}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <div className="message-meta">
                <span className="message-time">{timeString || "Sending..."}</span>
                {isSender && message.status === "sent" && (
                  <span className="message-status">✓</span>
                )}
              </div>
              
              {isSender && selectedMessageId === doc.id && (
                <div className="message-actions">
                  <button 
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMessage(doc.id);
                      setSelectedMessageId(null);
                    }}
                  >
                    Delete for everyone
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessagesContainer;