"use client";
import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket only once
  socketRef.current = io("http://18.175.220.231:80", {
    transports: ["websocket"],
    upgrade: false,
    timeout: 60000,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    withCredentials: true,
    forceNew: true
  });

  // Cleanup only on full page unload (not route changes)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  
  // Optional: Add debug logging
  useEffect(() => {
    if (!socket) return;
    
    const logSocketEvent = (event: string) => {
      return (...args: any[]) => {
        console.log(`Socket event: ${event}`, args);
      };
    };

    socket.on('connect', logSocketEvent('connect'));
    socket.on('disconnect', logSocketEvent('disconnect'));
    socket.on('error', logSocketEvent('error'));

    return () => {
      socket.off('connect', logSocketEvent('connect'));
      socket.off('disconnect', logSocketEvent('disconnect'));
      socket.off('error', logSocketEvent('error'));
    };
  }, [socket]);

  return socket;
};