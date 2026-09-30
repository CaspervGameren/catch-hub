import "./styles/tailwind.css";
import "./styles/main.scss";

import type { SessionResponse } from "./types";
import { getElement, showGameUi, renderPlayers } from "./ui";
import { socket, initSocketListeners, sendLocationUpdate } from "./socket";
import { startGpsTracking } from "./location";

initSocketListeners();

let userRole: "runner" | "hunter" = "runner";

getElement("#join-form")?.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();

  const submitter = (e.submitter ||
    document.activeElement) as HTMLButtonElement | null;
  userRole = (submitter?.dataset.role as "runner" | "hunter") || "runner";

  const username =
    getElement<HTMLInputElement>("#player-name")?.value.trim() || "";
  const code =
    getElement<HTMLInputElement>("#session-code")?.value.trim() || "";

  if (!username || !code) return alert("Vul een naam en sessiecode in.");

  socket.emit(
    "joinSession",
    { code, username, role: userRole },
    (response: SessionResponse) => {
      if (!response.success || !response.session) {
        return alert(response.message);
      }

      showGameUi(username, userRole);
      renderPlayers(response.session.players, socket.id);

      if (userRole === "runner") {
        startGpsTracking(sendLocationUpdate);
      }
    },
  );
});

getElement("#share-location")?.addEventListener("click", () => {
  startGpsTracking(sendLocationUpdate);
});

const contactTrigger = document.querySelector("[data-contact-reveal]");
const contactCard = contactTrigger?.querySelector("[data-contact-card]");

if (
  contactTrigger &&
  contactCard &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  contactCard.classList.add("contact-reveal-pending");
  contactCard.toggleAttribute("inert", true);

  let lastScrollY = window.scrollY;
  let scrollDirection: "up" | "down" = "down";

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastScrollY) {
        scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
        lastScrollY = currentScrollY;
      }
    },
    { passive: true },
  );

  const contactObserver = new IntersectionObserver(
    ([entry]) => {
      const openFromTop = entry.isIntersecting
        ? scrollDirection === "down"
        : scrollDirection === "up";
      contactCard.classList.toggle("contact-reveal-from-bottom", !openFromTop);
      contactCard.classList.toggle(
        "contact-reveal-visible",
        entry.isIntersecting,
      );
      contactCard.toggleAttribute("inert", !entry.isIntersecting);
    },
    { threshold: 0.12 },
  );

  contactObserver.observe(contactTrigger);
}
