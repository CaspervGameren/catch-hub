import { getElement } from "./ui";

let isTrackingActive = false;
let watchId: number | undefined;

export function startGpsTracking(
  onLocationUpdate: (coords: { latitude: number; longitude: number }) => void,
) {
  const locationText = getElement("#location");
  const locationBtn = getElement<HTMLButtonElement>("#share-location");

  if (!navigator.geolocation) {
    if (locationText)
      locationText.textContent = "Geolocatie wordt niet ondersteund.";
    return;
  }

  if (isTrackingActive) return;
  isTrackingActive = true;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      if (locationText) {
        locationText.textContent = `Live GPS actief: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      onLocationUpdate({ latitude, longitude });
    },
    (error) => {
      if (locationText) {
        locationText.textContent = `Fout bij ophalen locatie: ${error.message}`;
      }
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
  );

  if (locationBtn) {
    locationBtn.textContent = "GPS Tracking Actief";
    locationBtn.disabled = true;
  }
}

export function stopGpsTracking() {
  if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
  watchId = undefined;
  isTrackingActive = false;
}
