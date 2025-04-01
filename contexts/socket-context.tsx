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
      const token = localStorage.getItem('authToken');
      
      socketRef.current = io("https://backendfst1.onrender.com", {
        transports: ["websocket"],
        auth: { token },
        timeout: 20000,
        reconnectionAttempts: 5,
        autoConnect: true,
      });

      // Presence tracking handlers
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          socketRef.current?.emit('presence', { status: 'away' });
        } else {
          socketRef.current?.emit('presence', { status: 'online' });
        }
      };

      const handleBeforeUnload = () => {
        socketRef.current?.emit('presence', { status: 'offline' });
      };

      // Core connection handlers
      socketRef.current
        .on('connect', () => {
          setIsConnected(true);
          setConnectionError('');
          socketRef.current?.emit('presence', { status: 'online' });
        })
        .on('disconnect', (reason) => {
          setIsConnected(false);
          setConnectionError(reason === 'io server disconnect' 
            ? 'Disconnected by server' 
            : 'Reconnecting...');
        })
        .on('connect_error', (err) => {
          setIsConnected(false);
          setConnectionError(err.message);
          setTimeout(() => socketRef.current?.connect(), 5000);
        });

      // Setup presence tracking
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        if (socketRef.current) {
          socketRef.current.off('connect');
          socketRef.current.off('disconnect');
          socketRef.current.off('connect_error');
          socketRef.current.disconnect();
        }
      };
    };

    if (!socketRef.current) {
      initializeSocket();
    }

    return () => {
      // Keep connection alive between page navigations
      // Only clean up when provider unmounts (app closes)
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