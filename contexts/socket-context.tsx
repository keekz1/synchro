// contexts/socket-context.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: ''
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState('');
  
    useEffect(() => {
      const token = localStorage.getItem('authToken');
      socketRef.current = io("https://backendfst1.onrender.com", {
        transports: ["websocket"],
        auth: { token },
        timeout: 20000,
        reconnectionAttempts: Infinity,
        autoConnect: true,
      });
  
      // Presence tracking
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          socketRef.current?.emit('presence', 'away');
        } else {
          socketRef.current?.emit('presence', 'active');
        }
      };
  
      // Heartbeat system
      const heartbeatInterval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('heartbeat');
        }
      }, 20000);
  
      document.addEventListener('visibilitychange', handleVisibilityChange);
  
      return () => {
        clearInterval(heartbeatInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        // Only disconnect on app close, not page navigation
        socketRef.current?.off('connect');
        socketRef.current?.off('disconnect');
        socketRef.current?.disconnect();
      };
    }, []);

  return (
    <SocketContext.Provider value={{ 
      socket: socketRef.current, 
      isConnected,
      connectionError
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);