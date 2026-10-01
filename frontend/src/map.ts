import type { GameZone } from "../../shared/gameZone";
import L from "leaflet";

let map: L.Map | null = null;
let runnerMarker: L.Marker | null = null;
let zoneLayer: L.Rectangle | undefined;
let activeZone: GameZone | undefined;
let myMarker: L.Marker | null = null;

// Standaard coördinaten (Nederland centrum) voor het opstarten
const DEFAULT_CENTER: [number, number] = [52.1326, 5.2913];

export function initMap() {
  if (map) return; // Al geïnitialiseerd

  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  // Maak de Leaflet kaart aan
  map = L.map("map").setView(DEFAULT_CENTER, 13);

  // OpenStreetMap tegels toevoegen
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
}

// Zorgt ervoor dat de kaart de juiste grootte aanneemt zodra het scherm zichtbaar wordt!
export function refreshMapLayout() {
  if (map) {
    setTimeout(() => {
      map?.invalidateSize();
    }, 100);
  }
}

// Update of plaats een marker op de kaart
export function updateMapMarker(
  type: "me" | "runner",
  coords: { latitude: number; longitude: number },
  popupText: string,
) {
  if (!map) initMap();
  if (!map) return;

  const latLng: [number, number] = [coords.latitude, coords.longitude];

  if (type === "me") {
    if (myMarker) {
      myMarker.setLatLng(latLng);
    } else {
      myMarker = L.marker(latLng).addTo(map).bindPopup(popupText);
    }
  } else if (type === "runner") {
    if (runnerMarker) {
      runnerMarker.setLatLng(latLng);
    } else {
      runnerMarker = L.marker(latLng).addTo(map).bindPopup(popupText);
    }
  }

  // Centreer de kaart op de nieuwe coördinaten
  map.setView(latLng, 15);
}

export function showZone(zone: GameZone | undefined) {
  if (!zone || !map) return;
  if (activeZone && JSON.stringify(activeZone) === JSON.stringify(zone)) return;
  activeZone = zone;
  zoneLayer?.remove();
  const bounds = L.latLngBounds([zone.south, zone.west], [zone.north, zone.east]);
  zoneLayer = L.rectangle(bounds, { color: "#2dd6b7", weight: 3, fillOpacity: 0.12 }).addTo(map);
  map.fitBounds(bounds, { padding: [25, 25] });
}
