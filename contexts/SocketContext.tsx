"use client";
import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket only once (moved inside useEffect)
  useEffect(() => {
    socketRef.current = io("http://18.175.220.231", {  // Removed :80 (default port)
      transports: ["websocket", "polling"],  // Added polling as fallback
      timeout: 60000,
      reconnectionAttempts: 5,  // Changed from Infinity to prevent infinite retries
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      autoConnect: true,  // Explicitly enable
      forceNew: false,  // Changed to reuse connections
      // Removed upgrade: false to allow protocol upgrades
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);  // Empty dependency array ensures single initialization

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  
  useEffect(() => {
    if (!socket) return;
    
    const eventLogger = (event: string) => (...args: any[]) => {
      console.log(`Socket ${event}:`, args);
    };

    socket.on('connect', eventLogger('connect'));
    socket.on('disconnect', eventLogger('disconnect'));
    socket.on('error', eventLogger('error'));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
    };
  }, [socket]);

  return socket;
};