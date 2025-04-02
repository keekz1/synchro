"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import ChatHeader from "@/components/ChatHeader";
import MessagesContainer from "@/components/MessageContainer";
import MessageInput from "@/components/MessageInput";
import "@/components/chat.css";
import { Session } from "next-auth";
import { useDocument } from "react-firebase-hooks/firestore";

const ChatPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [friendName, setFriendName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id || null;
  const friendId = router.query.friendId as string | undefined;
  const chatId = userId && friendId ? [userId, friendId].sort().join('_') : null;
  const [loading, setLoading] = useState<boolean>(true);

  const messagesRef = chatId ? collection(db, "chats", chatId, "messages") : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(messagesRef ? query(messagesRef, orderBy("createdAt", "asc")) : null);

  const typingRef = chatId && userId ? doc(db, "chats", chatId, "typing", userId) : null;
  const [typingSnapshot] = useDocument(chatId && friendId ? doc(db, "chats", chatId, "typing", friendId) : null);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesSnapshot?.size]);

  useEffect(() => {
    if (typingSnapshot?.data()?.isTyping) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [typingSnapshot]);

  useEffect(() => {
    if (!friendId) return;

    const fetchFriendName = async () => {
      try {
        const response = await fetch(`/api/getFriendName?friendId=${friendId}`);
        const data = await response.json();
        setFriendName(response.ok ? data.name : "Unknown User");
      } catch (error) {
        console.error("Error fetching friend's name:", error);
        setFriendName("Unknown User");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendName();
  }, [friendId]);

  const handleTyping = useCallback(async () => {
    if (!chatId || !userId || !typingRef) return;

    const docSnapshot = await getDoc(typingRef);
    if (!docSnapshot.exists()) {
      await setDoc(typingRef, { isTyping: true, lastUpdated: serverTimestamp() });
    } else {
      await updateDoc(typingRef, { isTyping: true, lastUpdated: serverTimestamp() });
    }

    setTimeout(async () => await updateDoc(typingRef, { isTyping: false, lastUpdated: serverTimestamp() }), 1000);
  }, [chatId, userId, typingRef]);

  const handleSendMessage = useCallback(async (session: Session | null) => {
    if (!newMessage.trim() || !userId || !messagesRef || !chatId || !session?.user) return;

    let tempDoc;
    try {
      tempDoc = await addDoc(messagesRef, {
        text: newMessage,
        senderId: userId,
        createdAt: serverTimestamp(),
        status: "sending",
        readBy: [],
      });

      const idToken = session.idToken;
      const response = await fetch(`/api/messages/send/${userId}/${friendId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify({ messageId: tempDoc.id, text: newMessage, chatId }),
      });

      if (!response.ok) throw new Error(await response.text());
      await updateDoc(doc(messagesRef, tempDoc.id), { status: "sent" });
    } catch (error) {
      if (tempDoc && messagesRef) {
        await updateDoc(doc(messagesRef, tempDoc.id), { 
          status: "failed", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    } finally {
      setNewMessage("");
    }
  }, [newMessage, userId, messagesRef, chatId, friendId]);

  // Conditional rendering based on session status, loading, and errors
  if (loading) return <div>Loading...</div>;
  if (sessionStatus === "loading") return <div className="chat-container">Loading session...</div>;
  if (sessionStatus === "unauthenticated") {
    return <div className="chat-container">Please log in to chat</div>;
  }
  if (!friendId) return <div className="chat-container">Invalid chat session</div>;
  if (messagesLoading) return <div className="chat-container">Loading messages...</div>;
  if (messagesError) return <div className="chat-container">Error loading messages: {messagesError.message}</div>;

  return (
    <div className="chat-container">
      <ChatHeader friendId={friendId} isTyping={isTyping} friendName={friendName} />
      <MessagesContainer messagesSnapshot={messagesSnapshot!} userId={userId} />
      <MessageInput 
        newMessage={newMessage} 
        setNewMessage={setNewMessage} 
        handleTyping={handleTyping} 
        handleSendMessage={() => handleSendMessage(session)} 
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatPage;
