import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp ,deleteDoc} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";

const regions = ["London", "Manchester", "Birmingham", "Edinburgh", "Liverpool", "Bristol", "Glasgow"];

const PublicChatPage = () => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("London");  
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const messagesRef = collection(db, `public_messages_${selectedRegion}`);
  const [messagesSnapshot] = useCollection(query(messagesRef, orderBy("createdAt", "asc")));

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (response.ok) {
          setUserName(data.name);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village;

          if (regions.includes(city)) {
            setUserRegion(city);
          } else {
            setUserRegion(null);
          }
        } catch (err) {
          console.error("Error fetching location:", err);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    if (userRegion !== selectedRegion) {
      setError(`You are in ${userRegion || "an unknown location"}. You can only send messages in ${selectedRegion}.`);
      return;
    }
  
    try {
      const messageRef = await addDoc(messagesRef, {
        text: newMessage,
        creatorName: userName || "Anonymous",
        createdAt: serverTimestamp(),
        expireAt: new Date(Date.now() + 86400000)  
      });
  
       setTimeout(async () => {
        try {
          await deleteDoc(messageRef);
        } catch (error) {
          console.error("Error auto-deleting message:", error);
        }
      }, 86400000);
  
      setNewMessage("");
      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesSnapshot]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <label htmlFor="region">Select Region:</label>
        <select
          id="region"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="ml-2 p-1 border rounded"
        >
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messagesSnapshot?.docs.map((doc) => {
          if (userRegion === selectedRegion) {
            const message = doc.data();
             if (new Date() > message.expireAt?.toDate()) return null;
            
            return (
              <div key={doc.id} className="p-2 border-b">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm text-purple-600">
                    {message.creatorName}:
                  </span>
                  <span className="flex-1 text-gray-800">{message.text}</span>
                </div>
              </div>
            );
          }
          return null;
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="text-red-500 p-2">{error}</p>}

      <div className="p-2 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          disabled={userRegion !== selectedRegion}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default PublicChatPage;