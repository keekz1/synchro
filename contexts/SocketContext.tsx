"use client";
import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<{
  socket: Socket | null;
  isConnected: boolean;
}>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket only once
  useEffect(() => {
    socketRef.current = io("https://api.wesynchro.com", {
      transports: ["websocket", "polling"], // Polling fallback for reliability
      upgrade: true,
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      withCredentials: true,
      forceNew: false
    });

    // Connection events
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const { socket, isConnected } = useContext(SocketContext);

  // Enhanced debug logging
  useEffect(() => {
    if (!socket) return;

    const eventLogger = (event: string) => (...args: any[]) => {
      console.log(`Socket ${event}:`, args);
    };

    const events = [
      'connect',
      'disconnect',
      'error',
      'reconnect',
      'reconnect_attempt',
      'reconnect_error'
    ];

    events.forEach(event => {
      socket.on(event, eventLogger(event));
    });

    return () => {
      events.forEach(event => {
        socket.off(event);
      });
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    emit: (event: string, ...args: any[]) => {
      if (socket) socket.emit(event, ...args);
    }
  };
};
