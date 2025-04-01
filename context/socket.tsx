import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection only on client side
    if (typeof window !== 'undefined') {
      socketRef.current = io('https://backendfst1.onrender.com', {
        transports: ['websocket'],
        timeout: 20000,
        reconnectionAttempts: 5,
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};