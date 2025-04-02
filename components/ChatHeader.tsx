import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { doc, getDoc } from "firebase/firestore";

interface ChatHeaderProps {
  friendId: string;
  isTyping: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friendId, isTyping }) => {
  const [friendName, setFriendName] = useState<string>("");

  useEffect(() => {
    const fetchFriendName = async () => {
      if (!friendId) return;

      try {
        const friendDocRef = doc(db, "users", friendId); // Assuming "users" collection
        const friendDocSnap = await getDoc(friendDocRef);

        if (friendDocSnap.exists()) {
          setFriendName(friendDocSnap.data().name); // Adjust field name if needed
        } else {
          setFriendName("Unknown User"); // Fallback if user not found
        }
      } catch (error) {
        console.error("Error fetching friend name:", error);
        setFriendName("Error Loading");
      }
    };

    fetchFriendName();
  }, [friendId]);

  return (
    <div className="chat-header">
      <h1>{friendName || "Loading..."}</h1>
      {isTyping && <div className="typing-indicator">Typing...</div>}
    </div>
  );
};

export default ChatHeader;
