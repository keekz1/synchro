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
    const initializeSocket = () => {
      if (!socketRef.current) {
        socketRef.current = io("https://backendfst1.onrender.com", {
          transports: ["websocket"],
          timeout: 20000,
          reconnectionAttempts: 5,
          autoConnect: true,
        });

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          setConnectionError('');
          const token = localStorage.getItem('authToken');
          if (token) {
            socketRef.current?.emit('authenticate', { token });
          }
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
          setConnectionError('Reconnecting...');
        });

        socketRef.current.on('connect_error', (err) => {
          setIsConnected(false);
          setConnectionError(err.message);
          setTimeout(() => socketRef.current?.connect(), 5000);
        });
      }
    };

    initializeSocket();

    return () => {
      // Keep connection alive between page navigations
      // socketRef.current?.disconnect();
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