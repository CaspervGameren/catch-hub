import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface ChaseVideo {
  title: string;
  coordinates: [number, number];
  src: string;
}

// Add your team's MP4/WebM files to frontend/public/videos, then fill in src.
// These are illustrative filming spots, not recorded player locations.
export const chaseVideos: ChaseVideo[] = [
  { title: "Beurs — start of the chase", coordinates: [51.9185, 4.4803], src: "" },
  { title: "Coolsingel — on the run", coordinates: [51.9202, 4.4795], src: "" },
  { title: "Blaak — escaping the hunters", coordinates: [51.9187, 4.4836], src: "" },
  { title: "Witte de Withstraat — taking cover", coordinates: [51.9158, 4.4772], src: "" },
  { title: "Schiedamse Vest — the final sprint", coordinates: [51.9166, 4.4795], src: "" },
];

export function initChaseVideos() {
  const container = document.getElementById("chase-video-map");
  if (!container) return;

  const filmingArea = L.latLngBounds([51.9100, 4.4500], [51.9300, 4.5100]);
  const map = L.map(container, {
    scrollWheelZoom: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false,
    maxBounds: filmingArea,
    maxBoundsViscosity: 1,
    maxZoom: 19,
  }).setView([51.9185, 4.4803], 16);

  // Prevent zooming out far enough to expose places outside the filming area.
  const constrainViewport = () => {
    const minimumZoom = Math.ceil(map.getBoundsZoom(filmingArea, true));
    map.setMinZoom(minimumZoom);
    if (map.getZoom() < minimumZoom) map.setZoom(minimumZoom, { animate: false });
    map.panInsideBounds(filmingArea, { animate: false });
  };
  map.on("resize", () => {
    map.fitBounds(L.latLngBounds(chaseVideos.map((spot) => spot.coordinates)), { padding: [45, 45] });
    constrainViewport();
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  chaseVideos.forEach((spot, index) => {
    const popup = document.createElement("div");
    popup.className = "chase-video-popup";
    const heading = document.createElement("h3");
    heading.textContent = spot.title;
    popup.append(heading);

    let video: HTMLVideoElement | undefined;
    if (spot.src) {
      video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = spot.src;
      video.setAttribute("aria-label", spot.title);
      popup.append(video);
      const fallback = document.createElement("p");
      fallback.hidden = true;
      fallback.textContent = "This clip could not be loaded. Please try again later.";
      video.addEventListener("error", () => { fallback.hidden = false; });
      popup.append(fallback);
    } else {
      const placeholder = document.createElement("p");
      placeholder.className = "chase-video-placeholder";
      placeholder.textContent = "Team footage coming soon";
      popup.append(placeholder);
    }

    const marker = L.marker(spot.coordinates, {
      title: spot.title,
      alt: `Video spot ${index + 1}: ${spot.title}`,
      icon: L.divIcon({
        className: "chase-video-marker",
        html: `<span aria-hidden="true">${index + 1} ▶</span>`,
        iconSize: [48, 36],
        iconAnchor: [24, 18],
      }),
    }).addTo(map).bindPopup(popup, { autoPan: false, maxWidth: 320, className: "chase-video-leaflet-popup" });
    marker.on("popupclose", () => video?.pause());
  });

  map.fitBounds(L.latLngBounds(chaseVideos.map((spot) => spot.coordinates)), { padding: [45, 45], maxZoom: 16 });
  constrainViewport();
}
