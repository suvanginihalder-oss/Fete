/**
 * Pre-indexed major Indian states, union territories, and key urban centers
 * with verified coordinates and timezone.
 * Skips geocoding API round-trips for sub-100ms instant loading.
 */
export interface CityCoordinates {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const POPULAR_INDIAN_CITIES: CityCoordinates[] = [
  // North / NCR Smog Zone
  { city: 'Delhi', state: 'Delhi NCR', latitude: 28.65, longitude: 77.23, timezone: 'Asia/Kolkata' },
  { city: 'Noida', state: 'Uttar Pradesh', latitude: 28.58, longitude: 77.33, timezone: 'Asia/Kolkata' },
  { city: 'Gurugram', state: 'Haryana', latitude: 28.46, longitude: 77.03, timezone: 'Asia/Kolkata' },
  { city: 'Faridabad', state: 'Haryana', latitude: 28.41, longitude: 77.32, timezone: 'Asia/Kolkata' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.67, longitude: 77.45, timezone: 'Asia/Kolkata' },
  { city: 'Chandigarh', state: 'Punjab / Haryana', latitude: 30.73, longitude: 76.78, timezone: 'Asia/Kolkata' },
  { city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.85, longitude: 80.95, timezone: 'Asia/Kolkata' },
  { city: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.45, longitude: 80.33, timezone: 'Asia/Kolkata' },
  { city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.32, longitude: 82.97, timezone: 'Asia/Kolkata' },
  { city: 'Patna', state: 'Bihar', latitude: 25.59, longitude: 85.14, timezone: 'Asia/Kolkata' },
  { city: 'Jaipur', state: 'Rajasthan', latitude: 26.91, longitude: 75.79, timezone: 'Asia/Kolkata' },
  { city: 'Amritsar', state: 'Punjab', latitude: 31.63, longitude: 74.87, timezone: 'Asia/Kolkata' },
  { city: 'Srinagar', state: 'Jammu & Kashmir', latitude: 34.08, longitude: 74.80, timezone: 'Asia/Kolkata' },
  { city: 'Dehradun', state: 'Uttarakhand', latitude: 30.32, longitude: 78.03, timezone: 'Asia/Kolkata' },

  // West & Central
  { city: 'Mumbai', state: 'Maharashtra', latitude: 19.07, longitude: 72.88, timezone: 'Asia/Kolkata' },
  { city: 'Pune', state: 'Maharashtra', latitude: 18.52, longitude: 73.86, timezone: 'Asia/Kolkata' },
  { city: 'Nagpur', state: 'Maharashtra', latitude: 21.15, longitude: 79.08, timezone: 'Asia/Kolkata' },
  { city: 'Ahmedabad', state: 'Gujarat', latitude: 23.02, longitude: 72.57, timezone: 'Asia/Kolkata' },
  { city: 'Surat', state: 'Gujarat', latitude: 21.17, longitude: 72.83, timezone: 'Asia/Kolkata' },
  { city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.26, longitude: 77.41, timezone: 'Asia/Kolkata' },
  { city: 'Indore', state: 'Madhya Pradesh', latitude: 22.72, longitude: 75.86, timezone: 'Asia/Kolkata' },

  // East & North East
  { city: 'Kolkata', state: 'West Bengal', latitude: 22.57, longitude: 88.36, timezone: 'Asia/Kolkata' },
  { city: 'Bhubaneswar', state: 'Odisha', latitude: 20.30, longitude: 85.82, timezone: 'Asia/Kolkata' },
  { city: 'Ranchi', state: 'Jharkhand', latitude: 23.34, longitude: 85.31, timezone: 'Asia/Kolkata' },
  { city: 'Guwahati', state: 'Assam', latitude: 26.14, longitude: 91.74, timezone: 'Asia/Kolkata' },

  // South
  { city: 'Bengaluru', state: 'Karnataka', latitude: 12.97, longitude: 77.59, timezone: 'Asia/Kolkata' },
  { city: 'Hyderabad', state: 'Telangana', latitude: 17.39, longitude: 78.49, timezone: 'Asia/Kolkata' },
  { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.08, longitude: 80.27, timezone: 'Asia/Kolkata' },
  { city: 'Kochi', state: 'Kerala', latitude: 9.93, longitude: 76.27, timezone: 'Asia/Kolkata' },
  { city: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.52, longitude: 76.94, timezone: 'Asia/Kolkata' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.69, longitude: 83.22, timezone: 'Asia/Kolkata' }
];

export function findIndexedCity(query: string): CityCoordinates | undefined {
  const q = query.trim().toLowerCase();
  return POPULAR_INDIAN_CITIES.find(
    (c) => c.city.toLowerCase() === q || c.state.toLowerCase() === q
  );
}

