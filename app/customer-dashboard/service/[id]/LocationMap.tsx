"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, Search } from "lucide-react";

const PAKISTAN_CENTER: L.LatLngExpression = [30.3753, 69.3451];
const PAKISTAN_BOUNDS = L.latLngBounds(
  [23.5, 60.5],
  [37.5, 77.8],
);

const selectedLocationIcon = L.divIcon({
  className: "selected-location-marker",
  html: '<span class="selected-location-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

type LocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
  address?: string;
  onAddressChange?: (address: string) => void;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

function photonResult(feature: { geometry?: { coordinates?: number[] }; properties?: Record<string, string> }): SearchResult | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;

  const properties = feature.properties ?? {};
  const label = [properties.name, properties.street, properties.city, properties.state, properties.country]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");

  return {
    display_name: label || "Selected location",
    lat: String(coordinates[1]),
    lon: String(coordinates[0]),
  };
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
    const data = await response.json();
    const result = data.features?.map(photonResult).find(Boolean) as SearchResult | undefined;
    if (result) return result;
  } catch {
    // Fall back to Nominatim below.
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
  const data = await response.json();
  return {
    display_name: data.display_name || "Selected location",
    lat: String(latitude),
    lon: String(longitude),
  };
}

export default function LocationMap({ latitude, longitude, onChange, address = "", onAddressChange }: LocationMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setQuery(address);
  }, [address]);

  const applyResult = (result: SearchResult) => {
    const nextLatitude = Number(result.lat);
    const nextLongitude = Number(result.lon);
    if (!PAKISTAN_BOUNDS.contains([nextLatitude, nextLongitude])) {
      setSearchError("Please select a location inside Pakistan.");
      return;
    }

    setSearchError("");
    onChangeRef.current(nextLatitude, nextLongitude);
    onAddressChange?.(result.display_name);
    setQuery(result.display_name);
    setSuggestions([]);
    mapRef.current?.setView([nextLatitude, nextLongitude], 16);
    markerRef.current?.setLatLng([nextLatitude, nextLongitude]).openPopup();
  };

  const searchLocation = async (searchText = query) => {
    const search = searchText.trim();
    if (!search) {
      setSuggestions([]);
      return;
    }
    try {
      setSearching(true);
      setSearchError("");
      let results: SearchResult[] = [];
      try {
        const photonResponse = await fetch(
          `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(`${search}, Pakistan`)}`,
        );
        const photonData = await photonResponse.json();
        results = (photonData.features ?? [])
          .map(photonResult)
          .filter((result: SearchResult | null): result is SearchResult => Boolean(result));
      } catch {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=pk&addressdetails=1&q=${encodeURIComponent(search)}`,
        );
        results = await nominatimResponse.json();
      }
      setSuggestions(results);
      if (!results.length) setSearchError("Location not found.");
    } catch {
      setSearchError("Unable to search location right now.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchLocation(query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Location is not supported by this browser.");
      return;
    }

    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await reverseGeocode(coords.latitude, coords.longitude);
          applyResult(result);
        } catch {
          onChangeRef.current(coords.latitude, coords.longitude);
          setQuery("Current location");
          onAddressChange?.("Current location");
        } finally {
          setSearching(false);
        }
      },
      () => {
        setSearching(false);
        setSearchError("Unable to access your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const hasSelectedAddress = Boolean(address.trim()) && latitude !== null && longitude !== null;
    const initialLocation = hasSelectedAddress && PAKISTAN_BOUNDS.contains([latitude, longitude])
      ? ([latitude, longitude] as L.LatLngExpression)
      : PAKISTAN_CENTER;
    const map = L.map(mapElement.current, {
      zoomControl: true,
      maxBounds: PAKISTAN_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 5,
    }).setView(initialLocation, hasSelectedAddress ? 13 : 6);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(initialLocation, { icon: selectedLocationIcon }).addTo(map);
    marker.bindPopup("Selected service location");
    map.on("click", (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng).openPopup();
      onChangeRef.current(event.latlng.lat, event.latlng.lng);
      void reverseGeocode(event.latlng.lat, event.latlng.lng)
        .then((result) => {
          setQuery(result.display_name);
          onAddressChange?.(result.display_name);
        })
        .catch(() => {
          setQuery("Selected map location");
          onAddressChange?.("Selected map location");
        });
    });

    mapRef.current = map;
    markerRef.current = marker;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (!address.trim()) return;

    if (latitude === null || longitude === null) return;
    const nextLocation: L.LatLngExpression = [latitude, longitude];
    marker.setLatLng(nextLocation);
    if (PAKISTAN_BOUNDS.contains(nextLocation)) {
      map.panTo(nextLocation);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchLocation();
            }
          }}
          placeholder="Search a real place or exact address"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          aria-label="Search location"
        />
        <button
          type="button"
          onClick={() => void searchLocation()}
          disabled={searching || !query.trim()}
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:bg-slate-300"
        >
          {searching ? "Searching..." : "Search"}
        </button>
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-16 top-12 z-[500] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {suggestions.map((result) => (
              <button
                key={`${result.lat}-${result.lon}`}
                type="button"
                onClick={() => applyResult(result)}
                className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-xs text-slate-700 last:border-0 hover:bg-teal-50"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {searchError && <p className="text-xs font-medium text-red-600">{searchError}</p>}
      <div ref={mapElement} className="w-full overflow-hidden rounded-xl border border-slate-200" style={{ height: "420px", minHeight: "320px" }} aria-label="Select service location on map" />
      <button type="button" onClick={useCurrentLocation} disabled={searching} className="flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-800 disabled:text-slate-400">
        {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
        Use my current location
      </button>
      <p className="text-xs text-slate-500">Search a place, choose a suggestion, or click anywhere on the map.</p>
    </div>
  );
}
