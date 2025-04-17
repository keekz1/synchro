// src/context/SocketContext.tsx
"use client";
import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, ...args: any[]) => void;
  connectionError: string | null;
  retryConnection: () => void;
}

const SocketContext = createContext<SocketContextType>({ 
  socket: null, 
  isConnected: false,
  emit: () => {},
  connectionError: null,
  retryConnection: () => {}
});

// Environment variables
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://api.wesynchro.com";
const RECONNECT_MAX_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 3000;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);

  const handleRetry = () => {
    if (reconnectAttempts.current < RECONNECT_MAX_ATTEMPTS) {
      reconnectAttempts.current += 1;
      initializeSocket();
    } else {
      setConnectionError("Maximum reconnect attempts reached");
    }
  };

  const validateAndEmit = (event: string, data: any) => {
    if (!socketRef.current?.connected) {
      setConnectionError('Connection lost - attempting to reconnect...');
      handleRetry();
      return false;
    }

    try {
      switch(event) {
        case 'user-location':
          if (!validateLocationData(data)) throw new Error('Invalid location data');
          break;
        case 'create-ticket':
          if (!validateTicketData(data)) throw new Error('Invalid ticket data');
          break;
      }
      return true;
    } catch (err) {
      console.error('Validation error:', err);
      return false;
    }
  };

  const emit = (event: string, ...args: any[]) => {
    if (validateAndEmit(event, args[0])) {
      socketRef.current?.emit(event, ...args);
    }
  };

  const initializeSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
    }
    const socketInstance = io("wss://api.wesynchro.com", {
      path: "/socket.io",
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      secure: true,
      rejectUnauthorized: process.env.NODE_ENV === 'production', // Only validate cert in production
      timeout: 10000,
      query: {
        clientType: 'web',
        version: '1.0'
      }
    });
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setConnectionError('Server disconnected');
      } else if (reason !== 'io client disconnect') {
        setConnectionError('Connection lost - reconnecting...');
        setTimeout(handleRetry, Math.min(RECONNECT_DELAY_BASE * 2 ** reconnectAttempts.current, 30000));
      }
    };

    const handleConnectError = (err: Error) => {
      setIsConnected(false);
      setConnectionError(getErrorMessage(err));
      if (reconnectAttempts.current < RECONNECT_MAX_ATTEMPTS) {
        setTimeout(handleRetry, Math.min(RECONNECT_DELAY_BASE * 2 ** reconnectAttempts.current, 30000));
      }
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Listen to server events
    socketInstance.on('nearby-users', (users: any[]) => {
      // Handle nearby users update
    });

    socketInstance.on('new-ticket', (ticket: any) => {
      // Handle new ticket
    });

    socketInstance.on('all-tickets', (tickets: any[]) => {
      // Handle initial tickets load
    });

    socketRef.current = socketInstance;

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.disconnect();
    };
  };

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket: socketRef.current, 
      isConnected,
      emit,
      connectionError,
      retryConnection: handleRetry
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Validation functions
function validateLocationData(data: any): boolean {
  return !!(
    data &&
    typeof data.lat === 'number' &&
    typeof data.lng === 'number' &&
    typeof data.role === 'string' &&
    data.lat >= -90 &&
    data.lat <= 90 &&
    data.lng >= -180 &&
    data.lng <= 180
  );
}

function validateTicketData(data: any): boolean {
  return !!(
    data &&
    typeof data.lat === 'number' &&
    typeof data.lng === 'number' &&
    typeof data.message === 'string' &&
    typeof data.creatorId === 'string' &&
    typeof data.creatorName === 'string'
  );
}

function getErrorMessage(err: Error): string {
  const message = err.message.toLowerCase();
  if (message.includes("404")) return "Server endpoint not found";
  if (message.includes("econnrefused")) return "Server unavailable";
  if (message.includes("timeout")) return "Connection timeout";
  return "Connection error - please check your network";
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};