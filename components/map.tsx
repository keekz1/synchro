import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import { debounce } from 'lodash'; // Import debounce function
import styles from './map.module.css';
import FloatingChat from "@/components/FloatingChat";
import { GoogleMap, Marker, useJsApiLoader, Circle } from '@react-google-maps/api';



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
  const [userRole, setUserRole] = useState<string | null>(null); // State to store the role
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null); // State to store the role
  const [tickets, setTickets] = useState<Ticket[]>([]);
const [newTicketMessage, setNewTicketMessage] = useState('');
const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  let socket: ReturnType<typeof io> | null = null; // Global variable

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const locationCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null); // Correctly declare mapContainerRef here!

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
  const handleBeforeUnload = () => {
    localStorage.setItem("lastLeaveTime", Date.now().toString());
  };

  // Check if the user was away for more than 1 hour


  // generatePersistentOffset with caching logic
  const generatePersistentOffset = useCallback((userId: string | undefined, realLat: number, realLng: number) => {
    if (!userId) {
      console.error("generatePersistentOffset received an undefined userId");
      return { lat: realLat, lng: realLng }; // Fallback to real coordinates
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

  // Debounced location update
  const debouncedLocationUpdate = useMemo(
    () => debounce((lat: number, lng: number) => {
      setCurrentLocation({ lat, lng });
      if (socketRef.current && userRole) {
        socketRef.current.emit('user-location', { lat, lng, role: userRole, name: userName, image: userImage });
      }
    }, 500), [userRole, userName, userImage]
  );

  const handleVisibilityToggle = useCallback(() => {
    setIsVisible((prev) => {
      const newVisibility = !prev;
      localStorage.setItem('isVisible', JSON.stringify(newVisibility));
      socketRef.current?.emit('visibility-change', newVisibility);
      return newVisibility;
    });
  }, []);
useEffect(() => {
  setIsVisible(JSON.parse(localStorage.getItem("isVisible") ?? "true"));

  const fetchUserDetails = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch user details");
  
      console.log("Fetched user details:", data); // Debugging log
  
      setUserRole(data.role);
      setUserName(data.name);
      setUserImage(data.image); // Ensure this is not null or undefined
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };
  

  fetchUserDetails();

  // Check if the socket already exists before creating a new connection
  if (!socket) {
    socket = io("https://backendfst1.onrender.com", {
      transports: ["websocket"],
      timeout: 20000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setIsConnecting(false);
      setMapError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const realLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          debouncedLocationUpdate(realLocation.lat, realLocation.lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMapError("Enable location permissions to use this feature");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    socket.on("connect_error", () => {
      setMapError("Connection issues - retrying...");
      setIsConnecting(true);
    });

    socket.on("nearby-users", (data: User[]) => {
      console.log("Nearby users received:", data); // Debugging log
    
      const uniqueUsers = new Map<string, User>();
      data.forEach((user) => {
        if (!uniqueUsers.has(user.id)) {
          uniqueUsers.set(user.id, {
            ...user,
            ...generatePersistentOffset(user.id, user.lat, user.lng),
            image: user.image || "default-avatar.png", // Ensure fallback image
          });
        }
      });
      setNearbyUsers(Array.from(uniqueUsers.values()));
    });
    
    socket.on("new-ticket", (ticket: Ticket) => {
      setTickets((prevTickets) => [...prevTickets, ticket]);
    });

    socket.on("all-tickets", (tickets: Ticket[]) => {
      setTickets(tickets);
    });
  }

  // Listen for page unload event to save the leave time
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [isLoaded, generatePersistentOffset, userRole, debouncedLocationUpdate]);


  const handleCreateTicket = () => {
    setIsCreatingTicket((prev) => !prev);
  };

  const handleTicketSubmit = () => {
    if (currentLocation && newTicketMessage.trim()) {
      const ticket: Ticket = {
        id: Date.now().toString(),
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        message: newTicketMessage,
        creatorId: socketRef.current?.id || 'unknown',
        creatorName: userName || 'unknown',
      };
      socketRef.current?.emit('create-ticket', ticket);
      setNewTicketMessage('');
      setIsCreatingTicket(false);
    }
  };
   
  const handleMapLoad = (map: google.maps.Map): void => {
    // Perform necessary actions with the map instance
    console.log("Map loaded", map);
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
        zoom={13}
        options={{ disableDefaultUI: true, styles: mapStyle }}
        onLoad={handleMapLoad}
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
    icon={{
      url: user.image,  // Ensure this is a valid image URL
      scaledSize: new window.google.maps.Size(40, 40), // Adjust size as needed
    }}
  />
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