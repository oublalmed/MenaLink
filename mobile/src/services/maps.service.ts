// Google Maps, Places Autocomplete, Distance Matrix, Reverse Geocoding
// All calls go to Google APIs with EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

const GOOGLE_API_KEY  = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PLACES_BASE     = 'https://maps.googleapis.com/maps/api/place';
const GEOCODE_BASE    = 'https://maps.googleapis.com/maps/api/geocode';
const DISTANCE_BASE   = 'https://maps.googleapis.com/maps/api/distancematrix';
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  location: LatLng;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface DistanceResult {
  distanceMeters: number;
  distanceText: string;    // e.g. "5.2 km"
  durationSeconds: number;
  durationText: string;    // e.g. "12 mins"
}

export interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

export interface RouteResult {
  distance: DistanceResult;
  steps: DirectionStep[];
  polylineEncoded: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function googleFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google API error: ${response.status}`);
  const data = (await response.json()) as T & { status?: string; error_message?: string };
  if ((data as { status?: string }).status && !['OK', 'ZERO_RESULTS'].includes((data as { status: string }).status)) {
    throw new Error(`Google API status: ${(data as { status: string; error_message?: string }).status} — ${(data as { error_message?: string }).error_message ?? ''}`);
  }
  return data;
}

// ── Places Autocomplete ───────────────────────────────────────────────────────

/**
 * Retourne des suggestions d'adresse à partir d'un texte (Google Places Autocomplete).
 * Biaisé vers le Maroc (components=country:MA, language=fr).
 */
export async function getAddressSuggestions(
  input: string,
  sessionToken?: string,
  location?: LatLng,
): Promise<PlaceSuggestion[]> {
  if (!input.trim() || input.length < 3) return [];
  const params = new URLSearchParams({
    input,
    key: GOOGLE_API_KEY,
    language: 'fr',
    components: 'country:MA',
    types: 'address',
    ...(sessionToken ? { sessiontoken: sessionToken } : {}),
    ...(location ? { location: `${location.lat},${location.lng}`, radius: '50000' } : {}),
  });

  interface AutocompleteResponse {
    predictions: {
      place_id: string;
      description: string;
      structured_formatting: { main_text: string; secondary_text?: string };
    }[];
  }

  const data = await googleFetch<AutocompleteResponse>(
    `${PLACES_BASE}/autocomplete/json?${params.toString()}`,
  );

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting.main_text,
    secondaryText: p.structured_formatting.secondary_text ?? '',
  }));
}

/**
 * Récupère les détails complets d'un lieu (adresse + coordonnées) via son place_id.
 */
export async function getPlaceDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_API_KEY,
    language: 'fr',
    fields: 'place_id,formatted_address,geometry,address_components',
    ...(sessionToken ? { sessiontoken: sessionToken } : {}),
  });

  interface PlaceDetailsResponse {
    result: {
      place_id: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: { long_name: string; types: string[] }[];
    };
  }

  const data = await googleFetch<PlaceDetailsResponse>(
    `${PLACES_BASE}/details/json?${params.toString()}`,
  );

  const r = data.result;
  const getComponent = (type: string) =>
    r.address_components.find((c) => c.types.includes(type))?.long_name;

  return {
    placeId: r.place_id,
    formattedAddress: r.formatted_address,
    location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
    city: getComponent('locality') ?? getComponent('administrative_area_level_2'),
    country: getComponent('country'),
    postalCode: getComponent('postal_code'),
  };
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

/**
 * Reverse geocoding : convertit des coordonnées en adresse lisible.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceDetails | null> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: GOOGLE_API_KEY,
    language: 'fr',
    result_type: 'street_address|route|neighborhood',
  });

  interface GeocodeResponse {
    results: {
      place_id: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: { long_name: string; types: string[] }[];
    }[];
  }

  const data = await googleFetch<GeocodeResponse>(
    `${GEOCODE_BASE}/json?${params.toString()}`,
  );

  if (!data.results?.length) return null;

  const r = data.results[0];
  const getComponent = (type: string) =>
    r.address_components.find((c) => c.types.includes(type))?.long_name;

  return {
    placeId: r.place_id,
    formattedAddress: r.formatted_address,
    location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
    city: getComponent('locality') ?? getComponent('administrative_area_level_2'),
    country: getComponent('country'),
    postalCode: getComponent('postal_code'),
  };
}

// ── Distance Matrix ───────────────────────────────────────────────────────────

/**
 * Calcule la distance et le temps de trajet entre deux points.
 */
export async function calculateDistance(
  origin: LatLng,
  destination: LatLng,
  mode: 'driving' | 'walking' | 'transit' = 'driving',
): Promise<DistanceResult | null> {
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    key: GOOGLE_API_KEY,
    language: 'fr',
    mode,
  });

  interface DistanceMatrixResponse {
    rows: {
      elements: {
        status: string;
        distance: { value: number; text: string };
        duration: { value: number; text: string };
      }[];
    }[];
  }

  const data = await googleFetch<DistanceMatrixResponse>(
    `${DISTANCE_BASE}/json?${params.toString()}`,
  );

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') return null;

  return {
    distanceMeters: element.distance.value,
    distanceText: element.distance.text,
    durationSeconds: element.duration.value,
    durationText: element.duration.text,
  };
}

/**
 * Calcule l'ETA en minutes entre l'origine et la destination.
 */
export async function getETA(origin: LatLng, destination: LatLng): Promise<number | null> {
  const result = await calculateDistance(origin, destination, 'driving');
  if (!result) return null;
  return Math.ceil(result.durationSeconds / 60);
}

// ── Directions ────────────────────────────────────────────────────────────────

/**
 * Obtient le chemin de navigation entre deux points (avec étapes et polyline).
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng,
  mode: 'driving' | 'walking' = 'driving',
): Promise<RouteResult | null> {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    key: GOOGLE_API_KEY,
    language: 'fr',
    mode,
  });

  interface DirectionsResponse {
    routes: {
      overview_polyline: { points: string };
      legs: {
        distance: { value: number; text: string };
        duration: { value: number; text: string };
        steps: {
          html_instructions: string;
          distance: { text: string };
          duration: { text: string };
          start_location: { lat: number; lng: number };
          end_location: { lat: number; lng: number };
        }[];
      }[];
    }[];
  }

  const data = await googleFetch<DirectionsResponse>(
    `${DIRECTIONS_BASE}/json?${params.toString()}`,
  );

  if (!data.routes?.length) return null;

  const route = data.routes[0];
  const leg = route.legs[0];

  const steps: DirectionStep[] = leg.steps.map((s) => ({
    instruction: s.html_instructions.replace(/<[^>]+>/g, ''),
    distance: s.distance.text,
    duration: s.duration.text,
    startLocation: { lat: s.start_location.lat, lng: s.start_location.lng },
    endLocation: { lat: s.end_location.lat, lng: s.end_location.lng },
  }));

  return {
    distance: {
      distanceMeters: leg.distance.value,
      distanceText: leg.distance.text,
      durationSeconds: leg.duration.value,
      durationText: leg.duration.text,
    },
    steps,
    polylineEncoded: route.overview_polyline.points,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Haversine distance between two points in km (client-side, no API call).
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Decode Google Maps encoded polyline to array of LatLng.
 */
export function decodePolyline(encoded: string): LatLng[] {
  const poly: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
}
