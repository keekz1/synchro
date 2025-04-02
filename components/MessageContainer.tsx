import React from "react";
import { QueryDocumentSnapshot, DocumentData , Timestamp  } from "firebase/firestore";  // Import Firestore types

interface Message {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  status: string;
}

interface MessagesContainerProps {
  messagesSnapshot: any;
  userId: string | null;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ messagesSnapshot, userId }) => {
  return (
    <div className="messages-container">
      {messagesSnapshot?.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {  // Explicitly define the type for 'doc'
        const message = doc.data() as Message;
        const isSender = message.senderId === userId;
        const timestamp = message.createdAt?.toDate?.();
        const timeString = timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return (
          <div key={doc.id} className={`message ${isSender ? "sent" : "received"}`}>
            <div className="message-content">
              <p>{message.text}</p>
              <div className="message-meta">
                <span className="message-time">{timeString || "Sending..."}</span>
                {isSender && message.status === "sent" && <span className="message-status">✓</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessagesContainer;
