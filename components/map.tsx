import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import styles from './map.module.css';
import FloatingChat from "@/components/FloatingChat";
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';
import CustomMarker from './Map/CustomMarker';
import { useSocket } from '@/contexts/SocketContext';
 
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
}

const MapComponent: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { socket, isConnected, emit } = useSocket();
  const locationCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const MemoizedCircle = React.memo(({ center }: { center: { lat: number; lng: number } }) => (
    <Circle
      center={center}
      radius={16093.4}
      options={{
        fillColor: '#6600CC',
        fillOpacity: 0.08,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.5,
        strokeWeight: 2
      }}
    />
  ));
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyDDmC7UTacmsXQ5c_9z4W1VozgoFwUn9AA',
    libraries: ['places'],
  });


  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E2E3A" 
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
          "color": "#E5E5E5"  
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#2E2E3A" 
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#1A1A2E" 
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#E5E5E5"  
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47" 
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#C5A880"  
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#C5A880" 
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"  
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3C3C47"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#0E4D92"  
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E2E3A" 
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2E8B57"  
        }
      ]
    }
  ];

  const generatePersistentOffset = useCallback((userId: string | undefined, realLat: number, realLng: number) => {
    if (!userId) return { lat: realLat, lng: realLng };

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
      setCurrentLocation({ lat, lng });
      if (isConnected && userRole) {
        emit('user-location', { 
          lat, 
          lng, 
          role: userRole,
          name: userName,
          image: userImage
        });
      }
    }, 500), [emit, isConnected, userRole, userName, userImage]
  );

  const handleVisibilityToggle = useCallback(() => {
    setIsVisible((prev) => {
      const newVisibility = !prev;
      localStorage.setItem('isVisible', JSON.stringify(newVisibility));
      emit('visibility-change', newVisibility);
      return newVisibility;
    });
  }, [emit]);
  function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (response.ok) {
          setUserRole(data.role);
          setUserName(data.name);
          setUserImage(data.image);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
  
    fetchUserDetails();
    setIsVisible(JSON.parse(localStorage.getItem("isVisible") ?? "true"));
  
    if (!socket) {
      setMapError("Connecting to server...");
      return;
    }
  
    const handleConnect = () => {
      setIsConnecting(false);
      setMapError(null);
      
      const cachedLocation = localStorage.getItem('cachedLocation');
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        setCurrentLocation(location);
        if (isConnected && userRole) {
          emit('user-location', { 
            lat: location.lat, 
            lng: location.lng,
            role: userRole,
            name: userName,
            image: userImage
          });
        }
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const realLocation = { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          };
          localStorage.setItem('cachedLocation', JSON.stringify(realLocation));
          debouncedLocationUpdate(realLocation.lat, realLocation.lng);
        },
        (error) => {
          if (!cachedLocation) {
            setMapError("Enable location permissions to use this feature");
          }
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
  
    const handleConnectError = () => {
      setMapError("Connection issues - retrying...");
      setIsConnecting(true);
    };
  
    const handleDisconnect = () => {
      setMapError("Reconnecting...");
      setIsConnecting(true);
    };
  
    const handleNearbyUsers = (data: User[]) => {
      if (!userRole || !currentLocation) return;
    
      const filteredUsers = data.filter(user => {
        const distance = getDistanceInMiles(currentLocation.lat, currentLocation.lng, user.lat, user.lng);
        return distance <= 10; // Only include users within 10 miles
      });
    
      const uniqueUsers = new Map<string, User>();
      filteredUsers.forEach((user) => {
        if (!uniqueUsers.has(user.id)) {
          uniqueUsers.set(user.id, { 
            ...user, 
            ...generatePersistentOffset(user.id, user.lat, user.lng) 
          });
        }
      });
    
      setNearbyUsers(Array.from(uniqueUsers.values()));
    };
    
    const handleNewTicket = (ticket: Ticket) => {
      setTickets((prev) => [...prev, ticket]);
    };
  
    socket?.on("connect", handleConnect);
    socket?.on("connect_error", handleConnectError);
    socket?.on("disconnect", handleDisconnect);
    socket?.on("nearby-users", handleNearbyUsers);
    socket?.on("new-ticket", handleNewTicket);
    socket?.on("all-tickets", setTickets);
  
    if (socket && !isConnected) {
      socket.connect();
    } else if (isConnected) {
      handleConnect();
    }
  
    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("connect_error", handleConnectError);
      socket?.off("disconnect", handleDisconnect);
      socket?.off("nearby-users", handleNearbyUsers);
      socket?.off("new-ticket", handleNewTicket);
      socket?.off("all-tickets", setTickets);
      
      locationCache.current.clear();
    };
  }, [socket, isConnected, emit, generatePersistentOffset, debouncedLocationUpdate, userRole, userName, userImage]);

  const handleCreateTicket = () => {
    setIsCreatingTicket((prev) => !prev);
  };

  const handleMapLoad = (map: google.maps.Map): void => {
    console.log("Map loaded", map);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCreatingTicket && mapContainerRef.current && !mapContainerRef.current.contains(event.target as Node)) {
        setIsCreatingTicket(false);
      }
    };

    if (isCreatingTicket) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreatingTicket]);

  const handleTicketSubmit = () => {
    if (currentLocation && newTicketMessage.trim() && socket) {
      const ticket: Ticket = {
        id: Date.now().toString(),
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        message: newTicketMessage,
        creatorId: socket.id || 'unknown',
        creatorName: userName || 'unknown',
      };
      emit('create-ticket', ticket);
      setNewTicketMessage('');
      setIsCreatingTicket(false);
    }
  };

  if (!isLoaded) return <div className={styles.loading}>Loading map...</div>;
  if (isConnecting) return <div className={styles.loading}>Connecting to server...</div>;
  if (mapError) return <div className={styles.error}>{mapError}</div>;
  if (!currentLocation) return <div className={styles.loading}>Getting your location...</div>;

  return (
    <div className={styles.container} ref={mapContainerRef}>
      <GoogleMap
  mapContainerClassName={styles.map}
  center={currentLocation}
  zoom={15}
  options={{
    styles: mapStyle,
    disableDefaultUI: true,
    fullscreenControl: false,
    restriction: {
      latLngBounds: {
        north: 85,
        south: -60,
        west: -170,
        east: 180,
      },
      strictBounds: true,
    },
    keyboardShortcuts: false,
  }}
  onLoad={handleMapLoad}
>
  {isVisible && (
    <>
      <MemoizedCircle 
        key={`circle-${isVisible}`}
        center={currentLocation} 
      />
      {nearbyUsers.map((user) => (
        <CustomMarker key={user.id} user={user} />
      ))}
    </>
  )}

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
      </GoogleMap>
      
      <FloatingChat />
      <button onClick={handleVisibilityToggle} className={styles.toggleButton}>
        {isVisible ? 'Hide your Location' : 'Show Location'}
      </button>
      <button onClick={handleCreateTicket} className={styles.createTicketButton}>
        {""}
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