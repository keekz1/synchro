'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useFirstVisitReload() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visitedKey = `visited_${pathname}`;
    const lastVisit = sessionStorage.getItem(visitedKey);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000; 

    if (!lastVisit) {
      sessionStorage.setItem(visitedKey, now.toString());
      
       setTimeout(() => {
        window.location.reload();
      }, 500);

       setTimeout(() => {
        sessionStorage.removeItem(visitedKey);
      }, twoHours);
    } else {
      const elapsed = now - parseInt(lastVisit, 10);

      if (elapsed > twoHours) {
        sessionStorage.removeItem(visitedKey);
      }
    }
  }, [pathname]);
}
