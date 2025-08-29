import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import styles from './map.module.css';
import FloatingChat from "@/components/FloatingChat";
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';
import CustomMarker from './Map/CustomMarker';
import { useSocket } from '@/contexts/SocketContext';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, addDoc, updateDoc, doc, serverTimestamp ,deleteDoc} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";

const regions = ["London", "Manchester", "Birmingham", "Edinburgh", "Liverpool", "Bristol", "Glasgow"];

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
  createdAt: Date;
  expireAt: Date;  
}

const MapComponent: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editTicketMessage, setEditTicketMessage] = useState('');
  const [userRegion, setUserRegion] = useState<string | null>(null);

  const { socket, isConnected, emit } = useSocket();
  const locationCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null);

   const ticketsCollection = userRegion ? collection(db, `tickets_${userRegion}`) : null;
  const ticketsQuery = ticketsCollection ? query(ticketsCollection, orderBy("createdAt", "asc")) : null;
  const [ticketsSnapshot] = useCollection(ticketsQuery);

 const tickets = useMemo(() => {
  if (!ticketsSnapshot || !currentLocation) return [];
  
  return ticketsSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: data.lat,
        lng: data.lng,
        message: data.message,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        createdAt: data.createdAt?.toDate(),
        expireAt: data.expireAt?.toDate()  
      } as Ticket;
    })
    .filter(ticket => {
      const distance = getDistanceInMiles(
        currentLocation.lat,
        currentLocation.lng,
        ticket.lat,
        ticket.lng
      );
      const isExpired = new Date() > ticket.expireAt; 
      return distance <= 10 && !isExpired;  
    });
}, [ticketsSnapshot, currentLocation]);

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
  MemoizedCircle.displayName = 'MemoizedCircle';

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
    const R = 3958.8;  
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    const determineRegion = async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village;
        setUserRegion(regions.includes(city) ? city : null);
      } catch (err) {
        console.error("Error fetching location:", err);
      }
    };

    if (currentLocation) {
      determineRegion(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation]);

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
        const distance = getDistanceInMiles(
          currentLocation.lat,
          currentLocation.lng,
          user.lat,
          user.lng
        );
        return distance <= 10 && user.role ===  "HR" ;
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

    socket?.on("connect", handleConnect);
    socket?.on("connect_error", handleConnectError);
    socket?.on("disconnect", handleDisconnect);
    socket?.on("nearby-users", handleNearbyUsers);

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
      locationCache.current.clear();
    };
  }, [socket, isConnected, emit, generatePersistentOffset, debouncedLocationUpdate, userRole, userName, userImage]);

  const handleCreateTicket = () => {
    setIsCreatingTicket((prev) => !prev);
  };

  const handleUpdateTicket = async (ticketId: string) => {
    if (!editTicketMessage.trim() || !userRegion) return;

    try {
      const ticketRef = doc(db, `tickets_${userRegion}`, ticketId);
      await updateDoc(ticketRef, {
        message: editTicketMessage,
        updatedAt: serverTimestamp()
      });
      setEditingTicketId(null);
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
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

  const handleTicketSubmit = async () => {
    if (currentLocation && newTicketMessage.trim() && userRegion) {
      try {
        const ticketRef = await addDoc(collection(db, `tickets_${userRegion}`), {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          message: newTicketMessage,
          creatorId: socket?.id || 'unknown',
          creatorName: userName || 'unknown',
          createdAt: serverTimestamp(),
          expireAt: new Date(new Date().getTime() + 7200000)  
        });
  
         setTimeout(async () => {
          try {
            await deleteDoc(ticketRef);
          } catch (error) {
            console.error("Error auto-deleting ticket:", error);
          }
        },7200000);
        
        setNewTicketMessage('');
        setIsCreatingTicket(false);
      } catch (error) {
        console.error("Error creating ticket:", error);
      }
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
          {!userRegion && (
            <div className={styles.error}>Tickets not available in your current region</div>
          )}
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticketItem}>
                <strong>{ticket.creatorName}</strong>
                {editingTicketId === ticket.id ? (
                  <div className={styles.editForm}>
                    <textarea
                      value={editTicketMessage}
                      onChange={(e) => setEditTicketMessage(e.target.value)}
                      className={styles.editTextarea}
                      aria-label="Edit ticket message"
                      placeholder="Edit your ticket message"
                    />
                    <div className={styles.editButtons}>
                      <button 
                        onClick={() => handleUpdateTicket(ticket.id)}
                        className={styles.saveButton}
                        aria-label="Save changes"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingTicketId(null)}
                        className={styles.cancelButton}
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{ticket.message}</p>
                    {ticket.creatorId === socket?.id && (
                      <button 
                        onClick={() => {
                          setEditingTicketId(ticket.id);
                          setEditTicketMessage(ticket.message);
                        }}
                        className={styles.editButton}
                        aria-label={`Edit ticket from ${ticket.creatorName}`}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
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