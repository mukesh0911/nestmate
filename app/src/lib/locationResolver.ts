export interface LocationEntityInput {
  id?: string;
  uid?: string;
  lat?: number;
  lng?: number;
  geoLocation?: { lat: number; lng: number } | null;
  city?: string;
  locality?: string;
  localities?: string[];
}

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Noida': { lat: 28.5355, lng: 77.3910 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
};

export const LOCALITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Chennai
  'Velachery': { lat: 12.9815, lng: 80.2180 },
  'T. Nagar': { lat: 13.0418, lng: 80.2341 },
  'Adyar': { lat: 13.0067, lng: 80.2571 },
  'Anna Nagar': { lat: 13.0878, lng: 80.2117 },
  'OMR': { lat: 12.9226, lng: 80.2312 },
  'OMR Perungudi': { lat: 12.9654, lng: 80.2461 },
  'Nungambakkam': { lat: 13.0569, lng: 80.2425 },
  'Besant Nagar': { lat: 13.0002, lng: 80.2667 },
  'Guindy': { lat: 13.0067, lng: 80.2206 },
  'Mylapore': { lat: 13.0368, lng: 80.2676 },
  'Thoraipakkam': { lat: 12.9416, lng: 80.2362 },
  'Kilpauk': { lat: 13.0827, lng: 80.2431 },

  // Bengaluru
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'HSR Layout': { lat: 12.9121, lng: 77.6446 },
  'Indiranagar': { lat: 12.9784, lng: 77.6408 },
  'Whitefield': { lat: 12.9698, lng: 77.7499 },
  'Electronic City': { lat: 12.8399, lng: 77.6770 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },

  // Hyderabad
  'Hitech City': { lat: 17.4435, lng: 78.3772 },
  'Gachibowli': { lat: 17.4401, lng: 78.3489 },
  'Banjara Hills': { lat: 17.4156, lng: 78.4419 },
  'Jubilee Hills': { lat: 17.4319, lng: 78.4071 },
  'Madhapur': { lat: 17.4483, lng: 78.3915 },
  'Kondapur': { lat: 17.4622, lng: 78.3568 },

  // Pune
  'Koregaon Park': { lat: 18.5362, lng: 73.8940 },
  'Kalyani Nagar': { lat: 18.5463, lng: 73.9033 },
  'Hinjewadi': { lat: 18.5912, lng: 73.7389 },
  'Magarpatta': { lat: 18.5158, lng: 73.9272 },
  'Viman Nagar': { lat: 18.5679, lng: 73.9143 },
  'Kothrud': { lat: 18.5074, lng: 73.8077 },

  // Mumbai
  'Andheri': { lat: 19.1197, lng: 72.8464 },
  'Andheri West': { lat: 19.1197, lng: 72.8464 },
  'Bandra': { lat: 19.0596, lng: 72.8295 },
  'Bandra West': { lat: 19.0596, lng: 72.8295 },
  'Powai': { lat: 19.1176, lng: 72.9060 },
  'Juhu': { lat: 19.1075, lng: 72.8263 },
  'Malad': { lat: 19.1874, lng: 72.8484 },
  'Goregaon': { lat: 19.1663, lng: 72.8526 },

  // Delhi NCR
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Cyber City': { lat: 28.4950, lng: 77.0895 },
  'Noida': { lat: 28.5355, lng: 77.3910 },
  'Dwarka': { lat: 28.5921, lng: 77.0460 },
  'Saket': { lat: 28.5244, lng: 77.2188 },
  'Vasant Kunj': { lat: 28.5293, lng: 77.1539 },
  'Greater Kailash': { lat: 28.5482, lng: 77.2343 },

  // Kolkata
  'Salt Lake': { lat: 22.5867, lng: 88.4178 },
  'New Town': { lat: 22.5855, lng: 88.4682 },
  'Park Street': { lat: 22.5511, lng: 88.3526 },

  // Ahmedabad
  'Satellite': { lat: 23.0304, lng: 72.5178 },
  'Bodakdev': { lat: 23.0384, lng: 72.5117 },
  'Vastrapur': { lat: 23.0350, lng: 72.5293 },

  // Jaipur
  'Malviya Nagar': { lat: 26.8532, lng: 75.8197 },
  'Vaishali Nagar': { lat: 26.9064, lng: 75.7428 },

  // Chandigarh
  'Sector 17': { lat: 30.7415, lng: 76.7791 },
  'Sector 35': { lat: 30.7231, lng: 76.7645 },

  // Kochi
  'Kakkanad': { lat: 10.0159, lng: 76.3419 },
  'Edappally': { lat: 10.0236, lng: 76.3117 },

  // Goa
  'Panaji': { lat: 15.4909, lng: 73.8278 },
  'Candolim': { lat: 15.5179, lng: 73.7634 },

  // Lucknow
  'Gomti Nagar': { lat: 26.8536, lng: 80.9992 },
  'Hazratganj': { lat: 26.8467, lng: 80.9462 },

  // Indore
  'Vijay Nagar': { lat: 22.7533, lng: 75.8937 },
  'Palasia': { lat: 22.7244, lng: 75.8839 },

  // Coimbatore
  'RS Puram': { lat: 11.0117, lng: 76.9472 },
  'Gandhipuram': { lat: 11.0183, lng: 76.9688 },
};

function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function isValidCoord(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

export function resolveEntityCoordinates(input: LocationEntityInput): { lat: number; lng: number } | null {
  // 1. Direct valid geoLocation
  if (input.geoLocation && isValidCoord(input.geoLocation.lat, input.geoLocation.lng)) {
    return { lat: input.geoLocation.lat, lng: input.geoLocation.lng };
  }

  // 2. Direct valid lat/lng
  if (isValidCoord(input.lat, input.lng)) {
    return { lat: input.lat!, lng: input.lng! };
  }

  const targetLocality = input.locality || input.localities?.[0];

  // 3. Known Locality Lookup
  if (targetLocality && LOCALITY_COORDINATES[targetLocality]) {
    const base = LOCALITY_COORDINATES[targetLocality];
    const seed = (input.id || input.uid || targetLocality);
    const hash = getStringHash(seed);
    const offsetLat = ((hash % 100) / 10000) * 0.3;
    const offsetLng = (((hash >> 3) % 100) / 10000) * 0.3;
    return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
  }

  // 4. Known City Lookup
  if (input.city && CITY_COORDINATES[input.city]) {
    const base = CITY_COORDINATES[input.city];
    const seed = (input.id || input.uid || input.city + (targetLocality || ''));
    const hash = getStringHash(seed);
    const offsetLat = ((hash % 100) / 10000) * 1.5;
    const offsetLng = (((hash >> 3) % 100) / 10000) * 1.5;
    return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
  }

  return null;
}
