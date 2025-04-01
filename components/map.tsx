import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash'; // Import debounce function
import styles from './map.module.css';
import FloatingChat from "@/components/FloatingChat";
import { GoogleMap, Marker, useJsApiLoader, Circle } from '@react-google-maps/api';

import { useSocket } from '@/contexts/socket-context';


interface User {
  id: string;
  lat: number;
  lng: number;
  role: string;
  image: string;  

}

interface Ticket {
  id: string;
  lat: number;
  lng: number;
  message: string;
  creatorId: string;
  creatorName: string;
  createdAt: number; // Change from Date to number
}


const MapComponent: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null); // State to store the role
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null); // State to store the role
  const [tickets, setTickets] = useState<Ticket[]>([]);
const [newTicketMessage, setNewTicketMessage] = useState('');
const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const locationCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null); // Correctly declare mapContainerRef here!
  const { socket, isConnected, connectionError } = useSocket();

  const [isOpen, setIsOpen] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyDDmC7UTacmsXQ5c_9z4W1VozgoFwUn9AA',
    libraries: ['places'],
  });

  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E2E3A"  // Slate Gray for background and land areas
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#E5E5E5"  // Platinum for text labels
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#2E2E3A"  // Matching the background for a sleek look
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  // Charcoal for administrative boundaries
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#1A1A2E"  // Deep Navy for Points of Interest (POI)
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#E5E5E5"  // Platinum for POI labels
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  // Charcoal for main roads
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#C5A880"  // Muted Gold for arterial roads
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#C5A880"  // Muted Gold for highways
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  // Charcoal for local roads
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  // Charcoal for transit routes
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#0E4D92"  // Royal Blue for water bodies
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E2E3A"  // Slate Gray for landscape areas
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E8B57"  // Emerald Green for parks and green spaces
        }
      ]
    }
  ];
  
  const generatePersistentOffset = useCallback((userId: string, realLat: number, realLng: number) => {
    if (Math.abs(realLat) > 90 || Math.abs(realLng) > 180) {
      console.error('Invalid coordinates received', realLat, realLng);
      return { lat: 0, lng: 0 };
    }
  
    if (!locationCache.current.has(userId)) {
      const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomOffset = (seed % 10) * 0.0001;
      locationCache.current.set(userId, {
        lat: realLat + randomOffset,
        lng: realLng + randomOffset,
      });
    }
    return locationCache.current.get(userId)!;
  }, []);
  
  const debouncedLocationUpdate = useMemo(
    () => debounce((lat: number, lng: number) => {
      if (socket?.connected) {
        setCurrentLocation({ lat, lng });
        socket.volatile.emit('user-location', {
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          role: userRole || 'user',
          name: userName || 'Anonymous',
          image: userImage || '/default-avatar.png'
        });
      }
    }, 500),
    [socket, userRole, userName, userImage]
  );
  
  const handleVisibilityToggle = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('isVisible', JSON.stringify(newVisibility));
    if (socket?.connected) {
      socket.emit('visibility-change', { 
        isVisible: newVisibility,
        lastLocation: currentLocation 
      });
    }
  }, [socket, isVisible, currentLocation]);
  
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/api/profile", {
          signal: abortController.signal,
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setUserRole(data.role?.trim() || 'user');
        setUserName(data.name?.trim() || 'Anonymous');
        setUserImage(data.image || '/default-avatar.png');
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Profile fetch error:", error);
        }
      }
    };
  
    const storedVisibility = localStorage.getItem("isVisible");
    setIsVisible(storedVisibility ? JSON.parse(storedVisibility) : true);
    
    fetchUserDetails();
    return () => abortController.abort();
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isConnected) {
        setConnectionTimeout(true);
      }
    }, 10000);
  
    return () => clearTimeout(timeout);
  }, [isConnected]);
  
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setCurrentLocation(null);
          console.error('Geolocation permission denied');
        }
      });
    }
  }, []);
  
  useEffect(() => {
    if (!socket) return;
  
    const handleConnect = () => console.log('Socket connected');
    const handleDisconnect = () => console.log('Socket disconnected');
  
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
  
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);
  
  useEffect(() => {
    if (!socket?.connected) return;
  
    const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCurrentLocation({ lat, lng });
      debouncedLocationUpdate(lat, lng);
    }, [debouncedLocationUpdate]);
  
    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);
      if (error.code === error.PERMISSION_DENIED) {
        socket.emit('location-error', 'permission-denied');
        setCurrentLocation(null);
      }
    };
  
    const handleLocationUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
  
    if (navigator.geolocation) {
      handleLocationUpdate();
    } else {
      socket.emit('location-error', 'unsupported');
    }
  
    const locationInterval = setInterval(handleLocationUpdate, 15000);
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit('heartbeat');
    }, 20000);
  
    const handleNearbyUsers = (users: User[]) => {
      setNearbyUsers(users.map(user => ({
        ...user,
        ...generatePersistentOffset(user.id, user.lat, user.lng)
      })));
    };
  
    const safeListeners = {
      connect: () => {
        handleLocationUpdate();
        socket.emit('presence', 'active');
        socket.emit('visibility-change', {
          isVisible: JSON.parse(localStorage.getItem('isVisible') ?? 'true')
        });
      },
      'nearby-users': handleNearbyUsers,
      'new-ticket': (ticket: Ticket) => setTickets(prev => [...prev, ticket]),
      'all-tickets': (tickets: Ticket[]) => {
        setTickets(tickets.filter(t => Date.now() - t.createdAt < 3600000));
      }
    };
  
    Object.entries(safeListeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
  
    return () => {
      clearInterval(locationInterval);
      clearInterval(heartbeatInterval);
      Object.entries(safeListeners).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.emit('presence', 'away');
    };
  }, [socket, debouncedLocationUpdate, generatePersistentOffset]);
  
  // Render logic
  if (connectionTimeout) return (
    <div className={styles.error}>
      Connection failed - Please check your network
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  
  if (!isLoaded) return <div className={styles.loading}>Loading map...</div>;
  if (!isConnected) return (
    <div className={styles.error}>
      {connectionError || 'Connecting to server...'}
      <button onClick={() => socket?.connect()}>Retry</button>
    </div>
  );
  if (!currentLocation) return <div className={styles.loading}>Getting your location...</div>;
  
const handleTicketSubmit = () => {
  if (currentLocation && newTicketMessage.trim()) {
    const ticket: Ticket = {
      id: Date.now().toString(),
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      message: newTicketMessage,
      creatorId: socket?.id || 'unknown',
      creatorName: userName || 'Anonymous',
      createdAt: Date.now()
    };
    socket?.emit('create-ticket', ticket);
    setNewTicketMessage('');
    setIsCreatingTicket(false);
  }
};

const handleCreateTicket = () => {
  setIsCreatingTicket((prev) => !prev);
};
  if (!isLoaded) return <div className={styles.loading}>Loading map...</div>;
  if (!isConnected) return (
    <div className={styles.error}>
      {connectionError || 'Connecting to server...'}
      <button onClick={() => socket?.connect()}>Retry Connection</button>
    </div>
  );  if (!currentLocation) return <div className={styles.loading}>Getting your location...</div>;

  return (
    <div className={styles.container} ref={mapContainerRef}>
      <GoogleMap
        mapContainerClassName={styles.map}
        center={currentLocation}
        zoom={13}
        options={{ disableDefaultUI: true, styles: mapStyle }}
      >
        {isVisible && (
          <>
            <Circle
              center={currentLocation}
              radius={16093.4}
              options={{ fillColor: '#6600CC', fillOpacity: 0.1, strokeColor: '#FFFFFF', strokeOpacity: 0.5, strokeWeight: 2 }}
            />
            {nearbyUsers.map((user) => (
              <Marker
                key={user.id}
                position={{ lat: user.lat, lng: user.lng }}
                icon={{ url: user.image, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 40) }}
              />
            ))}
        
          </>
        )}
      </GoogleMap>


      <div className={`${styles.ticketSidebar} ${isOpen ? "" : styles.hidden}`}>
        <h3>Tickets</h3>
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <div key={ticket.id} className={styles.ticketItem}>
              <strong>{ticket.creatorName}</strong>
              <p>{ticket.message}</p>
            </div>
          ))
        ) : (
          <p>No tickets yet</p>
        )}
      </div>
      <button 
        className={styles.ticketToggleButton} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "←" : "→"}
      </button>
 

      <FloatingChat />
      <button onClick={handleVisibilityToggle} className={styles.toggleButton}>
        {isVisible ? 'Hide your Location' : 'Show Location'}
      </button>
      <button onClick={handleCreateTicket} className={styles.createTicketButton}>
        Create Ticket
      </button>
      
      {isCreatingTicket && (
        <div className={styles.ticketInput}>
          <textarea
            value={newTicketMessage}
            onChange={(e) => setNewTicketMessage(e.target.value)}
            placeholder="Enter your ticket message"
          />
          <button onClick={handleTicketSubmit}>Submit</button>
        </div>
        
      )}
    </div>
  );
};

export default MapComponent;