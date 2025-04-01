"use client"; // Ensure this runs only on the client side

import { useEffect, useState } from "react";
import dynamic from "next/dynamic"; // Load map dynamically to avoid SSR issues
import styles from "@/components/map.module.css"; // Import CSS module

const MapComponent = dynamic(() => import("@/components/map"), { ssr: false });

export default function MapPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={styles.mapContainer}>
      {isLoaded ? <MapComponent /> : <p>Loading Map...</p>}
    </div>
  );
}
