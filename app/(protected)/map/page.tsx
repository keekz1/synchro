"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/map"), { ssr: false });

export default function MapPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Disable scrolling on mount
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full">
      {isLoaded ? <MapComponent /> : <p className="text-white absolute inset-0 flex items-center justify-center">Loading Map...</p>}
    </div>
  );
}