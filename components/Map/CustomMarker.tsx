import { useEffect, useState } from 'react';
import { Marker } from '@react-google-maps/api';

interface User {
  id: string;
  lat: number;
  lng: number;
  role: string;
  image: string;
}

interface CustomMarkerProps {
  user: User;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ user }) => {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    
    const context = canvas.getContext('2d');
    if (!context) {
      setError(true);
      return;
    }

    // Create circular clipping path
    context.beginPath();
    context.arc(25, 25, 25, 0, Math.PI * 2);
    context.closePath();
    context.clip();

    // Load and draw image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = user.image;

    img.onload = () => {
      if (!isMounted) return;

      try {
        // Draw image centered and scaled to cover
        const imgAspect = img.width / img.height;
        const targetAspect = 1; // Square aspect for circle
        let drawWidth, drawHeight, dx, dy;

        if (imgAspect > targetAspect) {
          // Landscape image
          drawHeight = 50;
          drawWidth = img.width * (drawHeight / img.height);
          dx = (50 - drawWidth) / 2;
          dy = 0;
        } else {
          // Portrait image
          drawWidth = 50;
          drawHeight = img.height * (drawWidth / img.width);
          dx = 0;
          dy = (50 - drawHeight) / 2;
        }

        context.drawImage(img, dx, dy, drawWidth, drawHeight);
        
        // Add white border
        context.beginPath();
        context.arc(25, 25, 25, 0, Math.PI * 2);
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();

        setIconUrl(canvas.toDataURL());
      } catch (e) {
        setError(true);
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      setError(true);
    };

    return () => {
      isMounted = false;
    };
  }, [user.image]);

  // Fallback to original image with CSS clipping
  const finalUrl = error ? user.image : iconUrl;



  
  return (
    <>
      <Marker
        position={{ lat: user.lat, lng: user.lng }}
        icon={{
          url: finalUrl,
          scaledSize: new window.google.maps.Size(50, 50),
          size: new window.google.maps.Size(50, 50),       // Fixed display size

          anchor: new window.google.maps.Point(25, 25),
        }}
        options={{
          optimized: false,
          zIndex: user.role === 'doctor' ? 1000 : 0
        }}
      />
      {/* Add global style tag for fallback images */}
      <style jsx global>{`
        .gm-style img[src="${user.image}"] {
          border-radius: 50% !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white !important;
        }
      `}</style>
    </>
  );
};

export default CustomMarker;