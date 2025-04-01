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
  ];const generatePersistentOffset = useCallback((userId: string, realLat: number, realLng: number) => {
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
      socket?.emit('user-location', { 
        lat, 
        lng, 
        role: userRole || 'user', 
        name: userName || 'Anonymous',
        image: userImage || '/default-avatar.png'
      });
    }, 500), 
    [socket, userRole, userName, userImage]
  );
  
  const handleVisibilityToggle = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('isVisible', JSON.stringify(newVisibility));
    socket?.emit('visibility-change', newVisibility);
  }, [socket, isVisible]);
  
  useEffect(() => {
    // Cleanup debounce on unmount
    return () => debouncedLocationUpdate.cancel();
  }, [debouncedLocationUpdate]);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error('Profile fetch failed');
        const data = await response.json();
        setUserRole(data.role);
        setUserName(data.name);
        setUserImage(data.image);
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };
  
    const storedVisibility = localStorage.getItem("isVisible");
    setIsVisible(storedVisibility ? JSON.parse(storedVisibility) : true);
    fetchUserDetails();
  }, []);
  
  useEffect(() => {
    if (!socket || !isConnected) return;
  
    const handleLocationUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        position => debouncedLocationUpdate(
          position.coords.latitude,
          position.coords.longitude
        ),
        error => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setCurrentLocation(null);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
  
    // Initial update
    handleLocationUpdate();
    
    // Periodic updates every 15 seconds
    const locationInterval = setInterval(handleLocationUpdate, 15000);
    
    // Socket event handlers
    const handleNearbyUsers = (users: User[]) => {
      const processedUsers = users.map(user => ({
        ...user,
        ...generatePersistentOffset(user.id, user.lat, user.lng)
      }));
      setNearbyUsers(processedUsers);
    };
  
    socket.on('connect', handleLocationUpdate);
    socket.on('nearby-users', handleNearbyUsers);
    socket.on('new-ticket', (ticket: Ticket) => {
      setTickets(prev => [...prev, ticket]);
    });    
    socket.on('all-tickets', (tickets: Ticket[]) => {
      setTickets(tickets);
    });
    return () => {
      clearInterval(locationInterval);
      socket.off('connect', handleLocationUpdate);
      socket.off('nearby-users', handleNearbyUsers);
      socket.off('new-ticket');
      socket.off('all-tickets');
    };
  }, [socket, isConnected, debouncedLocationUpdate, generatePersistentOffset]);
  
  const handleTicketSubmit = () => {
    if (currentLocation && newTicketMessage.trim()) {
      const ticket: Ticket = {
        id: Date.now().toString(),
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        message: newTicketMessage,
        creatorId: socket?.id || 'unknown',
        creatorName: userName || 'Anonymous',
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
  if (!isConnected) return <div className={styles.error}>{connectionError || 'Connecting...'}</div>;
  if (!currentLocation) return <div className={styles.loading}>Getting your location...</div>;

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