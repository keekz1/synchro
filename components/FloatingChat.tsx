"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import PublicChatPage from "@/components/chatmap";

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
       <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

       {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bottom-14 right-0 w-[350px] h-[500px] bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <PublicChatPage />
        </motion.div>
      )}
    </div>
  );
};

export default FloatingChat;
