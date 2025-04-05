"use client";
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socket = io("https://backendfst1.onrender.com", {
    transports: ["websocket"],
    timeout: 20000,
    reconnectionAttempts: 5,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);