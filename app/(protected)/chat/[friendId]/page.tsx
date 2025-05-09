"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc, setDoc ,  deleteDoc  } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import ChatHeader from "@/components/ChatHeader";
import MessagesContainer from "@/components/MessageContainer";
import MessageInput from "@/components/MessageInput";
import "@/components/chat.css";
import { useDocument } from 'react-firebase-hooks/firestore';
import { Session } from "next-auth";
 const ChatPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id || null;
  const friendId = params?.friendId as string | undefined;
  const chatId = userId && friendId ? [userId, friendId].sort().join('_') : null;

  const messagesRef = chatId ? collection(db, "chats", chatId, "messages") : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(
    messagesRef ? query(messagesRef, orderBy("createdAt", "asc")) : null
  );

  const typingRef = chatId && userId ? doc(db, "chats", chatId, "typing", userId) : null;
  const [typingSnapshot] = useDocument(chatId && friendId ? doc(db, "chats", chatId, "typing", friendId) : null);

  useEffect(() => {
    if (typingSnapshot?.data()?.isTyping) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [typingSnapshot]);

  const handleTyping = useCallback(async () => {
    if (!chatId || !userId || !typingRef) return;

    const docSnapshot = await getDoc(typingRef);
    if (!docSnapshot.exists()) {
      await setDoc(typingRef, { isTyping: true, lastUpdated: serverTimestamp() });
    } else {
      await updateDoc(typingRef, { isTyping: true, lastUpdated: serverTimestamp() });
    }

    setTimeout(async () => {
      await updateDoc(typingRef, { isTyping: false, lastUpdated: serverTimestamp() });
    }, 1000);
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
        deletedFor: [],
      });
      setNewMessage("");

      const idToken = session.idToken;
      const response = await fetch(`/api/messages/send/${userId}/${friendId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify({ 
          messageId: tempDoc.id, 
          text: newMessage, 
          chatId 
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      await updateDoc(doc(messagesRef, tempDoc.id), { status: "sent" });
    } catch (error: unknown) {
      if (tempDoc && messagesRef) {
        await updateDoc(doc(messagesRef, tempDoc.id), { 
          status: "failed", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
  }, [newMessage, userId, messagesRef, chatId, friendId]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!chatId || !userId) {
      console.error("Missing chatId or userId");
      return;
    }
  
    try {
       const messageRef = doc(db, "chats", chatId, "messages", messageId);
      
       const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        console.error("Message doesn't exist");
        return;
      }
      
      if (messageSnap.data().senderId !== userId) {
        console.error("User is not the sender of this message");
        return;
      }
  
       await deleteDoc(messageRef);
      console.log("Message permanently deleted");
      
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, [chatId, userId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesSnapshot?.size]);

  if (sessionStatus === "loading") return <div className="chat-container">Loading session...</div>;
  if (!friendId) return <div className="chat-container">Invalid chat session</div>;
  if (messagesLoading) return <div className="chat-container">Loading messages...</div>;
  if (messagesError) return <div className="chat-container">Error loading messages: {messagesError.message}</div>;

  return (
    <div className="chat-container">
      <ChatHeader friendId={friendId} isTyping={isTyping} />
      <MessagesContainer 
        messagesSnapshot={messagesSnapshot} 
        userId={userId}
        onDeleteMessage={handleDeleteMessage} 
      />
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