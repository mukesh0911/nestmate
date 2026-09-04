import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

// Strict global promise queue for rate limiting (1 request per second)
let globalGeocodeQueue = Promise.resolve();
const rateLimitMs = 1100; // 1.1 seconds to be safe

export function useGeocoding() {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocode = useCallback(async (city: string, locality?: string): Promise<GeoLocation | null> => {
    if (!city) return null;

    return new Promise((resolve) => {
      globalGeocodeQueue = globalGeocodeQueue.then(async () => {
        try {
          const queryStr = locality ? `${locality}, ${city}, India` : `${city}, India`;
          const encodedQuery = encodeURIComponent(queryStr);
          const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'NestMate/1.0 (hello@nestmate.in)'
            }
          });
          
          if (!response.ok) {
            resolve(null);
            return;
          }
          
          const data = await response.json();
          if (data && data.length > 0) {
            resolve({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              formattedAddress: data[0].display_name
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error('Geocoding error:', e);
          resolve(null);
        }
        
        // Wait before allowing the next item in the queue to process
        await new Promise(r => setTimeout(r, rateLimitMs));
      });
    });
  }, []);

  const geocodeAndSave = useCallback(async (
    type: 'user' | 'listing',
    id: string,
    city: string,
    locality?: string
  ): Promise<GeoLocation | null> => {
    setIsGeocoding(true);
    try {
      const location = await geocode(city, locality);
      if (location) {
        const ref = doc(db, type === 'user' ? 'users' : 'listings', id);
        try {
          await updateDoc(ref, { geoLocation: location });
        } catch (e) {
          // Ignore permission errors when updating other people's documents
        }
      }
      return location;
    } catch (e) {
      console.error(`Error saving ${type} location:`, e);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [geocode]);

  return { geocode, geocodeAndSave, isGeocoding };
}
