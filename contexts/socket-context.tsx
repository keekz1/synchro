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
      
      const socket = io("https://backendfst1.onrender.com", {
        transports: ["websocket"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000
      });
  
      // Connection events
      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionError('');
        socket.emit('presence', 'online');
      });
  
      socket.on('connect_error', (err) => {
        setIsConnected(false);
        setConnectionError(err.message);
      });
  
      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        setConnectionError(reason === 'transport close' 
          ? 'Reconnecting...' 
          : `Connection lost: ${reason}`);
      });
  
      socketRef.current = socket;
  
      return () => {
        // Don't disconnect here - let Socket.IO manage reconnections
        socket.removeAllListeners();
      };
    }, []);
  
    return (
      <SocketContext.Provider value={{ socket: socketRef.current, isConnected, connectionError }}>
        {children}
      </SocketContext.Provider>
    );
  };
export const useSocket = () => useContext(SocketContext);